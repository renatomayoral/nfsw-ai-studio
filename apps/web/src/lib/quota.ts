import { createHash, randomUUID } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db, schema } from '@repo/db'
// drizzle-orm is a direct dep of @repo/db — imported transitively via workspace
import {
  PLAN_LIMITS,
  STRIPE_PLAN_TO_TIER,
  type PlanTier,
  type PlanLimits,
} from '@repo/shared/types'
import { PLAN_ALIASES } from '@repo/payments'
import type { NextRequest } from 'next/server'

// ─── Constants ────────────────────────────────────────────────────────────────
const ANON_COOKIE = 'anon_id'
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// ─── Date helpers ─────────────────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

// ─── Fingerprint ──────────────────────────────────────────────────────────────
/**
 * Builds a stable fingerprint from the anon cookie + IP.
 * Using both prevents trivial abuse via cookie deletion.
 */
export function buildFingerprint(anonId: string, ip: string): string {
  return createHash('sha256').update(`${anonId}:${ip}`).digest('hex')
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  )
}

// ─── Plan resolution ──────────────────────────────────────────────────────────
/**
 * Resolves the active PlanTier for a given user by checking their subscription.
 * Falls back to 'free' if no active subscription found.
 */
export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  const sub = await db.query.subscription.findFirst({
    where: and(
      eq(schema.subscription.referenceId, userId),
      eq(schema.subscription.status, 'active'),
    ),
  })

  if (!sub) return 'free'

  const rawPlan = sub.plan.toLowerCase()
  const normalized = PLAN_ALIASES[rawPlan] ?? rawPlan
  return (STRIPE_PLAN_TO_TIER[normalized] as PlanTier | undefined) ?? 'free'
}

export function getLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier]
}

// ─── Generation types ─────────────────────────────────────────────────────────
export type GenerationType = 'image' | 'video'

export type QuotaCheckResult =
  | { allowed: true; queue: 'fast' | 'slow'; tier: PlanTier; limits: PlanLimits }
  | { allowed: false; reason: string; tier: PlanTier; limits: PlanLimits }

// ─── Anonymous quota ──────────────────────────────────────────────────────────
/**
 * Checks and (on success) increments the anonymous usage quota.
 * Returns the anon_id cookie value so the caller can set it in the response.
 */
export async function checkAnonymousQuota(
  req: NextRequest,
  type: GenerationType,
): Promise<QuotaCheckResult & { anonId: string }> {
  const ip = getClientIp(req)
  const anonId = req.cookies.get(ANON_COOKIE)?.value ?? randomUUID()
  const fingerprint = buildFingerprint(anonId, ip)
  const today = todayISO()
  const limits = PLAN_LIMITS.anonymous

  // Videos not allowed for anonymous users
  if (type === 'video') {
    return {
      allowed: false,
      reason: 'Crie uma conta grátis para gerar vídeos.',
      tier: 'anonymous',
      limits,
      anonId,
    }
  }

  // Upsert anonymous session
  const existing = await db.query.anonymousSession.findFirst({
    where: eq(schema.anonymousSession.fingerprint, fingerprint),
  })

  if (!existing) {
    // First-time visitor — create record
    await db.insert(schema.anonymousSession).values({
      id: randomUUID(),
      fingerprint,
      date: today,
      imagesCount: 1,
      welcomeVideoUsed: false,
    })
    return { allowed: true, queue: 'fast', tier: 'anonymous', limits, anonId }
  }

  // Reset daily count if new day
  if (existing.date !== today) {
    await db
      .update(schema.anonymousSession)
      .set({ date: today, imagesCount: 1, updatedAt: new Date() })
      .where(eq(schema.anonymousSession.fingerprint, fingerprint))
    return { allowed: true, queue: 'fast', tier: 'anonymous', limits, anonId }
  }

  // Check daily limit
  if (existing.imagesCount >= limits.imagesFastPerDay) {
    return {
      allowed: false,
      reason: `Limite de ${limits.imagesFastPerDay} imagens/dia atingido. Crie uma conta grátis para continuar.`,
      tier: 'anonymous',
      limits,
      anonId,
    }
  }

  // Increment
  await db
    .update(schema.anonymousSession)
    .set({ imagesCount: existing.imagesCount + 1, updatedAt: new Date() })
    .where(eq(schema.anonymousSession.fingerprint, fingerprint))

  return { allowed: true, queue: 'fast', tier: 'anonymous', limits, anonId }
}

// ─── Authenticated user quota ─────────────────────────────────────────────────
/**
 * Checks and (on success) increments the quota for an authenticated user.
 * If the fast quota is exhausted, allows the request but marks it as 'slow'.
 */
export async function checkUserQuota(
  userId: string,
  type: GenerationType,
  isWelcomeVideo = false,
): Promise<QuotaCheckResult> {
  const tier = await getUserPlanTier(userId)
  const limits = getLimits(tier)
  const today = todayISO()

  // ── Welcome video (free tier one-time perk) ─────────────────────────────
  if (type === 'video' && tier === 'free') {
    if (!isWelcomeVideo) {
      return {
        allowed: false,
        reason: 'Assine um plano para gerar vídeos. Ou use seu vídeo de boas-vindas.',
        tier,
        limits,
      }
    }

    // Check if welcome video already used
    const profile = await db.query.userProfile.findFirst({
      where: eq(schema.userProfile.userId, userId),
    })

    if (profile?.welcomeVideoUsed) {
      return {
        allowed: false,
        reason: 'Seu vídeo de boas-vindas já foi utilizado. Assine um plano para gerar mais vídeos.',
        tier,
        limits,
      }
    }

    // Mark as used
    if (profile) {
      await db
        .update(schema.userProfile)
        .set({ welcomeVideoUsed: true, updatedAt: new Date() })
        .where(eq(schema.userProfile.userId, userId))
    } else {
      await db.insert(schema.userProfile).values({
        userId,
        welcomeVideoUsed: true,
      })
    }

    return { allowed: true, queue: 'fast', tier, limits }
  }

  // ── Video check for paid plans ──────────────────────────────────────────
  if (type === 'video' && limits.videosFastPerDay === 0) {
    return {
      allowed: false,
      reason: 'Geração de vídeo não está disponível no seu plano.',
      tier,
      limits,
    }
  }

  // ── Upsert daily quota row ──────────────────────────────────────────────
  const existing = await db.query.usageQuota.findFirst({
    where: and(
      eq(schema.usageQuota.userId, userId),
      eq(schema.usageQuota.date, today),
    ),
  })

  if (!existing) {
    // First generation today — create row
    const row = {
      id: randomUUID(),
      userId,
      date: today,
      imagesFast: type === 'image' ? 1 : 0,
      imagesSlow: 0,
      videosFast: type === 'video' ? 1 : 0,
      videosSlow: 0,
    }
    await db.insert(schema.usageQuota).values(row)
    return { allowed: true, queue: 'fast', tier, limits }
  }

  // ── Image logic ─────────────────────────────────────────────────────────
  if (type === 'image') {
    if (existing.imagesFast < limits.imagesFastPerDay) {
      // Fast queue available
      await db
        .update(schema.usageQuota)
        .set({ imagesFast: existing.imagesFast + 1, updatedAt: new Date() })
        .where(and(eq(schema.usageQuota.userId, userId), eq(schema.usageQuota.date, today)))
      return { allowed: true, queue: 'fast', tier, limits }
    }
    // Exhausted fast → slow queue (unlimited, no hard cap on images)
    await db
      .update(schema.usageQuota)
      .set({ imagesSlow: existing.imagesSlow + 1, updatedAt: new Date() })
      .where(and(eq(schema.usageQuota.userId, userId), eq(schema.usageQuota.date, today)))
    return { allowed: true, queue: 'slow', tier, limits }
  }

  // ── Video logic ─────────────────────────────────────────────────────────
  if (existing.videosFast < limits.videosFastPerDay) {
    await db
      .update(schema.usageQuota)
      .set({ videosFast: existing.videosFast + 1, updatedAt: new Date() })
      .where(and(eq(schema.usageQuota.userId, userId), eq(schema.usageQuota.date, today)))
    return { allowed: true, queue: 'fast', tier, limits }
  }

  // Exhausted video fast → slow queue
  await db
    .update(schema.usageQuota)
    .set({ videosSlow: existing.videosSlow + 1, updatedAt: new Date() })
    .where(and(eq(schema.usageQuota.userId, userId), eq(schema.usageQuota.date, today)))
  return { allowed: true, queue: 'slow', tier, limits }
}

// ─── Quota status (for UI display) ───────────────────────────────────────────
export type QuotaStatus = {
  tier: PlanTier
  limits: PlanLimits
  today: {
    imagesFast: number
    imagesSlow: number
    videosFast: number
    videosSlow: number
  }
  welcomeVideoAvailable: boolean
}

export async function getUserQuotaStatus(userId: string): Promise<QuotaStatus> {
  const tier = await getUserPlanTier(userId)
  const limits = getLimits(tier)
  const today = todayISO()

  const [quota, profile] = await Promise.all([
    db.query.usageQuota.findFirst({
      where: and(
        eq(schema.usageQuota.userId, userId),
        eq(schema.usageQuota.date, today),
      ),
    }),
    db.query.userProfile.findFirst({
      where: eq(schema.userProfile.userId, userId),
    }),
  ])

  return {
    tier,
    limits,
    today: {
      imagesFast: quota?.imagesFast ?? 0,
      imagesSlow: quota?.imagesSlow ?? 0,
      videosFast: quota?.videosFast ?? 0,
      videosSlow: quota?.videosSlow ?? 0,
    },
    welcomeVideoAvailable:
      tier === 'free' && limits.welcomeVideoLifetime && !(profile?.welcomeVideoUsed ?? false),
  }
}

// ─── Cookie helper ────────────────────────────────────────────────────────────
export function buildAnonCookie(anonId: string): string {
  return `${ANON_COOKIE}=${anonId}; Path=/; Max-Age=${ANON_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`
}

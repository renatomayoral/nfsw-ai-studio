import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@repo/auth'
import { eq } from 'drizzle-orm'
import { db, schema } from '@repo/db'
import {
  getUserQuotaStatus,
  buildFingerprint,
  buildAnonCookie,
} from '@/lib/quota'
import { PLAN_LIMITS } from '@repo/shared/types'
import { randomUUID } from 'node:crypto'

const ANON_COOKIE = 'anon_id'

/**
 * GET /api/quota
 *
 * Returns the current quota status for the requesting user (authenticated or anonymous).
 * Used by the UI to show remaining fast generations and upgrade prompts.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })

  // ── Authenticated user ───────────────────────────────────────────────────
  if (session) {
    const status = await getUserQuotaStatus(session.user.id)
    return NextResponse.json(status)
  }

  // ── Anonymous user ────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'

  const anonId = req.cookies.get(ANON_COOKIE)?.value ?? randomUUID()
  const fingerprint = buildFingerprint(anonId, ip)
  const today = new Date().toISOString().slice(0, 10)

  const existing = await db.query.anonymousSession.findFirst({
    where: eq(schema.anonymousSession.fingerprint, fingerprint),
  })

  const imagesUsedToday =
    existing?.date === today ? (existing.imagesCount ?? 0) : 0

  const limits = PLAN_LIMITS.anonymous

  const res = NextResponse.json({
    tier: 'anonymous',
    limits,
    today: {
      imagesFast: imagesUsedToday,
      imagesSlow: 0,
      videosFast: 0,
      videosSlow: 0,
    },
    welcomeVideoAvailable: false,
  })

  // Ensure cookie is set even on quota-check calls
  if (!req.cookies.get(ANON_COOKIE)) {
    res.headers.set('Set-Cookie', buildAnonCookie(anonId))
  }

  return res
}

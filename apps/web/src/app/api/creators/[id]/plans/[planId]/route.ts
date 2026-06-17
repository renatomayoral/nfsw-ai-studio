import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'
import { archiveVipPrice } from '@repo/payments/stripe/connect'

const { creator, vipPlan } = schema

async function ownedPlan(creatorId: string, planId: string, userId: string) {
  const c = await db.query.creator.findFirst({ where: eq(creator.id, creatorId) })
  if (!c || c.userId !== userId) return null
  const plan = await db.query.vipPlan.findFirst({
    where: and(eq(vipPlan.id, planId), eq(vipPlan.creatorId, creatorId)),
  })
  if (!plan) return null
  return { creator: c, plan }
}

// ─── PATCH /api/creators/[id]/plans/[planId] — toggle active / edit meta ──────

const patchSchema = z.object({
  title: z.string().min(2).max(60).optional(),
  description: z.string().max(280).nullable().optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, planId } = await params
  const owned = await ownedPlan(id, planId, session.user.id)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Deactivating archives the Stripe Price so it can no longer be subscribed to.
  if (parsed.data.active === false && owned.plan.active && owned.plan.stripePriceId && owned.creator.stripeAccountId) {
    try {
      await archiveVipPrice(owned.creator.stripeAccountId, owned.plan.stripePriceId)
    } catch (err) {
      console.error('stripe price archive failed', err)
      return NextResponse.json({ error: 'Could not deactivate plan' }, { status: 502 })
    }
  }

  await db
    .update(vipPlan)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(vipPlan.id, planId))

  return NextResponse.json({ ok: true })
}

// ─── DELETE /api/creators/[id]/plans/[planId] ─────────────────────────────────
// FK from vip_subscription uses ON DELETE restrict — a plan with subscriptions
// can't be hard-deleted; deactivate it instead.

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, planId } = await params
  const owned = await ownedPlan(id, planId, session.user.id)
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (owned.plan.stripePriceId && owned.creator.stripeAccountId) {
    try {
      await archiveVipPrice(owned.creator.stripeAccountId, owned.plan.stripePriceId)
    } catch (err) {
      console.error('stripe price archive failed', err)
    }
  }

  try {
    await db.delete(vipPlan).where(eq(vipPlan.id, planId))
  } catch {
    // Has subscriptions (restrict) — fall back to soft delete.
    await db
      .update(vipPlan)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(vipPlan.id, planId))
    return NextResponse.json({ ok: true, softDeleted: true })
  }

  return NextResponse.json({ ok: true })
}

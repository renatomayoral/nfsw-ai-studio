import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { createSubscriptionCheckout } from '@repo/payments/stripe/connect'

const { creator, vipPlan, subscription } = schema

function appUrl(): string {
  return process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
}

/** Resolves the creator owner's platform plan (drives the take rate). */
async function ownerPlatformPlan(userId: string): Promise<string> {
  const sub = await db.query.subscription.findFirst({
    where: and(eq(subscription.referenceId, userId), eq(subscription.status, 'active')),
  })
  return sub?.plan ?? 'spark' // default to highest take rate when no paid plan
}

// ─── POST /api/checkout — a fan subscribes to a creator's VIP plan ───────────
// Public route (the fan is not authenticated). Creates a Stripe Checkout
// Session with a destination charge to the creator's connected account and
// the platform application fee.

const bodySchema = z.object({
  planId: z.string().min(1),
  /** Optional fan email to prefill the checkout. */
  email: z.string().email().optional(),
})

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { planId, email } = parsed.data

  const plan = await db.query.vipPlan.findFirst({
    where: and(eq(vipPlan.id, planId), eq(vipPlan.active, true)),
  })
  if (!plan || !plan.stripePriceId) {
    return NextResponse.json({ error: 'Plan not available' }, { status: 404 })
  }

  const c = await db.query.creator.findFirst({ where: eq(creator.id, plan.creatorId) })
  if (!c || !c.stripeAccountId || !c.stripeOnboarded) {
    return NextResponse.json({ error: 'Creator cannot accept payments' }, { status: 409 })
  }

  const platformPlan = await ownerPlatformPlan(c.userId)

  try {
    const checkoutSession = await createSubscriptionCheckout({
      creatorAccountId: c.stripeAccountId,
      creatorPlatformPlan: platformPlan,
      priceId: plan.stripePriceId,
      customerEmail: email,
      metadata: {
        creatorId: c.id,
        planId: plan.id,
        // tells the webhook which rail/owner to attribute this to
        provider: 'stripe',
      },
      successUrl: `${appUrl()}/p/${c.slug}?vip=success`,
      cancelUrl: `${appUrl()}/p/${c.slug}?vip=cancel`,
    })
    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('checkout session creation failed', err)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}

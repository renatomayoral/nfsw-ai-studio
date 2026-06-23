import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db, schema } from '@repo/db'
import { createSubscription } from '@/lib/nowpayments'

const { vipPlan, vipPlanPrice, vipSubscription, creator } = schema

const bodySchema = z.object({
  planId: z.string(),
  email: z.string().email(),
})

// POST /api/nowpayments/subscribe
// Creates a NowPayments recurring subscription for a VIP plan.
// NowPayments sends a payment link to the fan's email automatically.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { planId, email } = parsed.data

  const plan = await db.query.vipPlan.findFirst({ where: eq(vipPlan.id, planId) })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // Find the crypto price row with a nowpayments_plans_id configured
  const cryptoPrice = await db.query.vipPlanPrice.findFirst({
    where: and(
      eq(vipPlanPrice.planId, planId),
      eq(vipPlanPrice.provider, 'crypto_sub'),
    ),
  })

  if (!cryptoPrice?.nowpaymentsPlansId) {
    return NextResponse.json(
      { error: 'Este plano não possui subscription plan configurado no NowPayments.' },
      { status: 400 },
    )
  }

  try {
    const sub = await createSubscription({
      subscriptionPlanId: cryptoPrice.nowpaymentsPlansId,
      email,
    })

    // Upsert subscription row
    const existing = await db.query.vipSubscription.findFirst({
      where: eq(vipSubscription.nowpaymentsSubscriptionId, sub.id),
    })

    const c = await db.query.creator.findFirst({ where: eq(creator.id, plan.creatorId) })

    if (!existing) {
      await db.insert(vipSubscription).values({
        id: randomUUID(),
        creatorId: plan.creatorId,
        planId,
        fanEmail: email,
        provider: 'nowpayments',
        nowpaymentsSubscriptionId: sub.id,
        status: sub.status === 'PAID' ? 'active' : 'pending',
        currentPeriodEnd: sub.expireDate ? new Date(sub.expireDate) : null,
      })
    }

    return NextResponse.json({
      subscriptionId: sub.id,
      status: sub.status,
      expireDate: sub.expireDate,
      // Email with payment link was sent by NowPayments automatically
      message: `Link de pagamento enviado para ${email}`,
      creatorName: c?.name,
      planTitle: plan.title,
    })
  } catch (err) {
    console.error('[POST /api/nowpayments/subscribe]', err)
    const message = err instanceof Error ? err.message : 'Erro ao criar assinatura'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'
import { createPayment } from '@/lib/nowpayments'

const { creator, vipPlan, vipPlanPrice } = schema

const bodySchema = z.object({
  planId: z.string(),
  payCurrency: z.string().min(2).max(20), // e.g. "btc", "eth", "usdtbsc"
})

// POST /api/nowpayments/charge
// Creates a NowPayments crypto charge for a VIP plan subscription.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { planId, payCurrency } = parsed.data

  const plan = await db.query.vipPlan.findFirst({ where: eq(vipPlan.id, planId) })
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const c = await db.query.creator.findFirst({ where: eq(creator.id, plan.creatorId) })
  if (!c) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  // Find crypto price — prefer USD, fallback to first available
  const prices = await db.query.vipPlanPrice.findMany({ where: eq(vipPlanPrice.planId, planId) })
  const cryptoPrice = prices.find(p => p.provider === 'crypto' && p.currency === 'usd')
    ?? prices.find(p => p.provider === 'crypto')
    ?? prices.find(p => p.currency === 'usd')

  if (!cryptoPrice) return NextResponse.json({ error: 'No crypto price configured for this plan' }, { status: 400 })

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  const orderId = `${planId}-${Date.now()}`

  try {
    const payment = await createPayment({
      priceAmount: cryptoPrice.amountCents / 100,
      priceCurrency: cryptoPrice.currency,
      payCurrency,
      orderId,
      orderDescription: `${c.name} — ${plan.title}`,
      ipnCallbackUrl: `${appUrl}/api/webhooks/nowpayments`,
    })

    return NextResponse.json(payment)
  } catch (err) {
    console.error('[POST /api/nowpayments/charge]', err)
    return NextResponse.json({ error: 'Erro ao criar cobrança crypto' }, { status: 502 })
  }
}

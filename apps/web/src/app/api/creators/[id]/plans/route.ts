import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'
import { createVipPrice } from '@repo/payments/stripe/connect'

const { creator, vipPlan } = schema

async function ownedCreator(id: string, userId: string) {
  const c = await db.query.creator.findFirst({ where: eq(creator.id, id) })
  if (!c || c.userId !== userId) return null
  return c
}

// ─── GET /api/creators/[id]/plans — list a creator's VIP plans ───────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const c = await ownedCreator(id, session.user.id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const plans = await db.query.vipPlan.findMany({
    where: eq(vipPlan.creatorId, id),
    orderBy: (p, { asc }) => [asc(p.intervalDay)],
  })
  return NextResponse.json(plans)
}

// ─── POST /api/creators/[id]/plans — create a VIP plan ───────────────────────

const createSchema = z.object({
  title: z.string().min(2).max(60),
  description: z.string().max(280).nullable().optional(),
  /** Price in cents */
  amount: z.number().int().min(100),
  currency: z.string().length(3).toLowerCase().default('usd'),
  intervalDay: z.number().int().min(1).max(366).default(30),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const c = await ownedCreator(id, session.user.id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // A plan can only be sold once the creator can actually receive money.
  if (!c.stripeAccountId || !c.stripeOnboarded) {
    return NextResponse.json(
      { error: 'Connect a payout account before creating plans' },
      { status: 409 },
    )
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { title, description, amount, currency, intervalDay } = parsed.data

  let stripePriceId: string
  try {
    stripePriceId = await createVipPrice({
      creatorAccountId: c.stripeAccountId,
      title,
      description: description ?? undefined,
      amount,
      currency,
      intervalDay,
    })
  } catch (err) {
    console.error('stripe price creation failed', err)
    return NextResponse.json({ error: 'Could not create price' }, { status: 502 })
  }

  const planId = randomUUID()
  await db.insert(vipPlan).values({
    id: planId,
    creatorId: id,
    title,
    description: description ?? null,
    amount,
    currency,
    intervalDay,
    stripePriceId,
  })

  return NextResponse.json({ id: planId, stripePriceId }, { status: 201 })
}

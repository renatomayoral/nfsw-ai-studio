import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'
import {
  createConnectedAccount,
  createOnboardingLink,
  createDashboardLink,
  isAccountReady,
} from '@repo/payments/stripe/connect'

const { creator } = schema

async function ownedCreator(id: string, userId: string) {
  const c = await db.query.creator.findFirst({ where: eq(creator.id, id) })
  if (!c || c.userId !== userId) return null
  return c
}

function appUrl(): string {
  return process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
}

// ─── POST /api/creators/[id]/connect ──────────────────────────────────────────
// Starts (or resumes) Stripe Connect onboarding. Creates the connected account
// on first call, then returns a fresh onboarding link. If already onboarded,
// returns a dashboard login link instead.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const c = await ownedCreator(id, session.user.id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    // Already fully onboarded → send them to their Stripe dashboard.
    if (c.stripeAccountId && c.stripeOnboarded) {
      const url = await createDashboardLink(c.stripeAccountId)
      return NextResponse.json({ url, status: 'onboarded' })
    }

    // Create the connected account on first connect.
    let accountId = c.stripeAccountId
    if (!accountId) {
      const account = await createConnectedAccount({
        creatorId: c.id,
        email: session.user.email,
      })
      accountId = account.id
      await db
        .update(creator)
        .set({ stripeAccountId: accountId, updatedAt: new Date() })
        .where(eq(creator.id, id))
    }

    const url = await createOnboardingLink({
      accountId,
      refreshUrl: `${appUrl()}/creators/${id}?connect=refresh`,
      returnUrl: `${appUrl()}/creators/${id}?connect=return`,
    })
    return NextResponse.json({ url, status: 'onboarding' })
  } catch (err) {
    console.error('stripe connect onboarding failed', err)
    return NextResponse.json({ error: 'Stripe onboarding failed' }, { status: 502 })
  }
}

// ─── GET /api/creators/[id]/connect ───────────────────────────────────────────
// Re-checks the connected account and syncs `stripeOnboarded`. Called when the
// creator returns from the Stripe onboarding flow.

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const c = await ownedCreator(id, session.user.id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!c.stripeAccountId) {
    return NextResponse.json({ connected: false, onboarded: false })
  }

  try {
    const ready = await isAccountReady(c.stripeAccountId)
    if (ready !== c.stripeOnboarded) {
      await db
        .update(creator)
        .set({ stripeOnboarded: ready, updatedAt: new Date() })
        .where(eq(creator.id, id))
    }
    return NextResponse.json({ connected: true, onboarded: ready })
  } catch (err) {
    console.error('stripe connect status check failed', err)
    return NextResponse.json({ error: 'Stripe status check failed' }, { status: 502 })
  }
}

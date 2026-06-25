import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'

const { referral, user } = schema

function userIdToCode(userId: string): string {
  return Buffer.from(userId).toString('base64')
}

// GET /api/referral — returns the user's referral link and list of referred users
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const code = userIdToCode(session.user.id)
  const link = `${appUrl}/?ref=${code}`

  const referred = await db
    .select({
      id: referral.id,
      name: user.name,
      email: user.email,
      image: user.image,
      commissionRate: referral.commissionRate,
      activeUntil: referral.activeUntil,
      createdAt: referral.createdAt,
    })
    .from(referral)
    .innerJoin(user, eq(referral.referredId, user.id))
    .where(eq(referral.referrerId, session.user.id))
    .orderBy(referral.createdAt)

  return NextResponse.json({ link, referred })
}

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth } from '@repo/auth'
import { db, schema } from '@repo/db'
import { ReferralClient } from './_components/referral-client'

export const dynamic = 'force-dynamic'

function userIdToCode(userId: string): string {
  return Buffer.from(userId).toString('base64')
}

export default async function ReferralPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/${locale}/login`)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const code = userIdToCode(session.user.id)
  const link = `${appUrl}/?ref=${code}`

  const referred = await db
    .select({
      id: schema.referral.id,
      name: schema.user.name,
      email: schema.user.email,
      image: schema.user.image,
      commissionRate: schema.referral.commissionRate,
      activeUntil: schema.referral.activeUntil,
      createdAt: schema.referral.createdAt,
    })
    .from(schema.referral)
    .innerJoin(schema.user, eq(schema.referral.referredId, schema.user.id))
    .where(eq(schema.referral.referrerId, session.user.id))
    .orderBy(schema.referral.createdAt)

  return <ReferralClient link={link} referred={referred} />
}

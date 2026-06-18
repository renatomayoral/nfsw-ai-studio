import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { auth } from '@repo/auth'
import { db, schema } from '@repo/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const { platformToken, creator } = schema

const BMAC_API = 'https://developers.buymeacoffee.com/api/v1'

const Body = z.object({
  creatorId: z.string(),
  accessToken: z.string().min(10),
})

// POST /api/buymeacoffee/token
// Validates and saves the creator's BMaC personal access token.
// Creator gets their token at: https://developers.buymeacoffee.com/dashboard
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = Body.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { creatorId, accessToken } = body.data

  const c = await db.query.creator.findFirst({ where: eq(creator.id, creatorId) })
  if (!c || c.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Validate token against BMaC API
  const res = await fetch(`${BMAC_API}/subscriptions?status=active`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (res.status === 401 || res.status === 403) {
    return NextResponse.json({ error: 'Token inválido. Verifique e tente novamente.' }, { status: 422 })
  }
  if (!res.ok) {
    return NextResponse.json({ error: 'Erro ao validar token no Buy Me a Coffee' }, { status: 502 })
  }

  // Fetch creator profile
  const profileRes = await fetch(`${BMAC_API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const profile = profileRes.ok ? await profileRes.json() as { name?: string; username?: string } : {}

  const existing = await db.query.platformToken.findFirst({
    where: and(eq(platformToken.creatorId, creatorId), eq(platformToken.platform, 'buymeacoffee')),
  })

  const row = {
    accessToken,
    platformHandle: profile.username ?? profile.name ?? null,
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(platformToken).set(row).where(eq(platformToken.id, existing.id))
  } else {
    await db.insert(platformToken).values({
      id: randomUUID(),
      creatorId,
      platform: 'buymeacoffee',
      scopes: ['supporters', 'subscriptions'],
      ...row,
    })
  }

  return NextResponse.json({ ok: true, handle: profile.username ?? profile.name })
}

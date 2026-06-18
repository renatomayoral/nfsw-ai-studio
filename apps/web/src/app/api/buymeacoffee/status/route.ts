import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@repo/auth'
import { db, schema } from '@repo/db'
import { eq, and } from 'drizzle-orm'

const { platformToken, creator } = schema

const BMAC_API = 'https://developers.buymeacoffee.com/api/v1'

// GET /api/buymeacoffee/status?creatorId=xxx
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const creatorId = req.nextUrl.searchParams.get('creatorId')
  if (!creatorId) return NextResponse.json({ error: 'creatorId required' }, { status: 400 })

  const c = await db.query.creator.findFirst({ where: eq(creator.id, creatorId) })
  if (!c || c.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const token = await db.query.platformToken.findFirst({
    where: and(eq(platformToken.creatorId, creatorId), eq(platformToken.platform, 'buymeacoffee')),
  })

  if (!token) return NextResponse.json({ connected: false })

  return NextResponse.json({
    connected: true,
    handle: token.platformHandle,
  })
}

// GET /api/buymeacoffee/status/stats?creatorId=xxx — fetch live stats
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const creatorId = req.nextUrl.searchParams.get('creatorId')
  if (!creatorId) return NextResponse.json({ error: 'creatorId required' }, { status: 400 })

  const c = await db.query.creator.findFirst({ where: eq(creator.id, creatorId) })
  if (!c || c.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db
    .delete(platformToken)
    .where(and(eq(platformToken.creatorId, creatorId), eq(platformToken.platform, 'buymeacoffee')))

  return NextResponse.json({ ok: true })
}

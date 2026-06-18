import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { eq, max } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'

const { creator, creatorLink } = schema

async function ownedCreator(id: string, userId: string) {
  const c = await db.query.creator.findFirst({ where: eq(creator.id, id) })
  if (!c || c.userId !== userId) return null
  return c
}

const addSchema = z.object({
  platform: z.string().min(1).max(40),
  url: z.string().url(),
  label: z.string().max(60).optional(),
})

// POST /api/creators/[id]/links — add a platform link
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const c = await ownedCreator(id, session.user.id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = addSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { platform, url, label } = parsed.data

  // sortOrder = current max + 1
  const maxResult = await db
    .select({ maxOrder: max(creatorLink.sortOrder) })
    .from(creatorLink)
    .where(eq(creatorLink.creatorId, id))

  const maxOrder = maxResult[0]?.maxOrder ?? -1

  const linkId = randomUUID()
  await db.insert(creatorLink).values({
    id: linkId,
    creatorId: id,
    platform,
    url,
    label: label ?? null,
    sortOrder: maxOrder + 1,
    active: true,
  })

  const row = await db.query.creatorLink.findFirst({ where: eq(creatorLink.id, linkId) })
  return NextResponse.json(row, { status: 201 })
}

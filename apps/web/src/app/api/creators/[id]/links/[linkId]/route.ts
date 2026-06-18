import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'

const { creator, creatorLink } = schema

async function ownedLink(creatorId: string, linkId: string, userId: string) {
  const c = await db.query.creator.findFirst({ where: eq(creator.id, creatorId) })
  if (!c || c.userId !== userId) return null
  const link = await db.query.creatorLink.findFirst({
    where: and(eq(creatorLink.id, linkId), eq(creatorLink.creatorId, creatorId)),
  })
  return link ?? null
}

const patchSchema = z.object({
  url: z.string().url().optional(),
  label: z.string().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

// PATCH /api/creators/[id]/links/[linkId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, linkId } = await params
  const link = await ownedLink(id, linkId, session.user.id)
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await db.update(creatorLink).set(parsed.data).where(eq(creatorLink.id, linkId))
  return NextResponse.json({ ok: true })
}

// DELETE /api/creators/[id]/links/[linkId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, linkId } = await params
  const link = await ownedLink(id, linkId, session.user.id)
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(creatorLink).where(eq(creatorLink.id, linkId))
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'

const { platform } = schema

// ─── PATCH /api/platforms/[id] — update a platform ───────────────────────────

const updateSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  label: z.string().min(1).max(60).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  baseUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const existing = await db.select({ id: platform.id }).from(platform).where(eq(platform.id, id))
  if (!existing.length)
    return NextResponse.json({ error: 'Plataforma não encontrada' }, { status: 404 })

  await db
    .update(platform)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(platform.id, id))

  const row = await db.select().from(platform).where(eq(platform.id, id))
  return NextResponse.json(row[0])
}

// ─── DELETE /api/platforms/[id] — delete a platform ──────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await db.select({ id: platform.id }).from(platform).where(eq(platform.id, id))
  if (!existing.length)
    return NextResponse.json({ error: 'Plataforma não encontrada' }, { status: 404 })

  await db.delete(platform).where(eq(platform.id, id))
  return new NextResponse(null, { status: 204 })
}

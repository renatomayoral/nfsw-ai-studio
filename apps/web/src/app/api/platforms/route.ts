import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'

const { platform } = schema

// ─── GET /api/platforms — list all platforms ──────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select()
    .from(platform)
    .orderBy(asc(platform.sortOrder), asc(platform.label))
  return NextResponse.json(rows)
}

// ─── POST /api/platforms — create a platform ─────────────────────────────────

const createSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, 'Apenas letras minúsculas, números e hífens'),
  label: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (ex: #ec4899)'),
  baseUrl: z.string().url('URL inválida'),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { key, label, color, baseUrl, sortOrder = 0, active = true } = parsed.data

  const existing = await db.select({ id: platform.id }).from(platform).where(eq(platform.key, key))
  if (existing.length)
    return NextResponse.json({ error: 'Já existe uma plataforma com essa chave' }, { status: 409 })

  const id = randomUUID()
  await db.insert(platform).values({ id, key, label, color, baseUrl, sortOrder, active })

  const row = await db.select().from(platform).where(eq(platform.id, id))
  return NextResponse.json(row[0], { status: 201 })
}

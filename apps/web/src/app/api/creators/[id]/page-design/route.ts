import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'
import { PAGE_TEMPLATES } from '@/lib/page-templates'

const { creator } = schema

const validTemplateIds = PAGE_TEMPLATES.map((t) => t.id) as [string, ...string[]]

const bodySchema = z.object({
  pageTemplate: z.enum(validTemplateIds).optional(),
  pageConfig: z
    .object({
      accentColor: z.string().optional(),
      bgFrom: z.string().optional(),
      bgTo: z.string().optional(),
      bgMid: z.string().optional(),
      cardBg: z.string().optional(),
      cardBorder: z.string().optional(),
      textColor: z.string().optional(),
      mutedColor: z.string().optional(),
      fontFamily: z.string().optional(),
      glowOpacity: z.number().min(0).max(1).optional(),
      buttonStyle: z.enum(['pill', 'rounded', 'sharp']).optional(),
    })
    .optional(),
})

async function ownedCreator(id: string, userId: string) {
  return db.query.creator.findFirst({
    where: eq(creator.id, id),
    columns: { id: true, userId: true, pageTemplate: true, pageConfig: true },
  }).then((c) => (c?.userId === userId ? c : null))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const c = await ownedCreator(id, session.user.id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { pageTemplate, pageConfig } = parsed.data

  await db
    .update(creator)
    .set({
      ...(pageTemplate !== undefined && { pageTemplate }),
      ...(pageConfig !== undefined && { pageConfig: JSON.stringify(pageConfig) }),
      updatedAt: new Date(),
    })
    .where(eq(creator.id, id))

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const c = await ownedCreator(id, session.user.id)
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    pageTemplate: c.pageTemplate,
    pageConfig: c.pageConfig ? JSON.parse(c.pageConfig) : null,
  })
}

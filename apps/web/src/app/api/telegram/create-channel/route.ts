import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'
import { createTelegramChannel } from '@/lib/mtkruto'

const { creator } = schema

const BOT_USERNAME = process.env['NEXT_PUBLIC_TELEGRAM_BOT_USERNAME'] ?? '@CreatorsLinkBot'

const bodySchema = z.object({
  creatorId: z.string(),
  title: z.string().min(2).max(128),
  description: z.string().max(255).optional(),
})

// POST /api/telegram/create-channel
// Creates a private Telegram channel via the Creators Link user account,
// adds the bot as admin, leaves, and saves channelId on the creator.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { creatorId, title, description } = parsed.data

  const c = await db.query.creator.findFirst({ where: eq(creator.id, creatorId) })
  if (!c || c.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const result = await createTelegramChannel({
      title,
      description,
      botUsername: BOT_USERNAME,
    })

    await db
      .update(creator)
      .set({
        telegramChannelId: result.channelId,
        telegramChannelTitle: result.title,
        updatedAt: new Date(),
      })
      .where(eq(creator.id, creatorId))

    return NextResponse.json({
      channelId: result.channelId,
      channelTitle: result.title,
      inviteLink: result.inviteLink,
    })
  } catch (err) {
    console.error('[POST /api/telegram/create-channel]', err)
    const message = err instanceof Error ? err.message : 'Erro ao criar canal'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

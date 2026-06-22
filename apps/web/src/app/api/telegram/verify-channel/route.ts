import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@repo/db'
import { auth } from '@repo/auth'

const { creator } = schema

const bodySchema = z.object({
  creatorId: z.string(),
  channelUsername: z.string().min(1),
})

// Normalise "@babibarelli_vip" or "https://t.me/babibarelli_vip" → "@babibarelli_vip"
function normaliseChannel(raw: string): string {
  const s = raw.trim()
  const match = s.match(/(?:t\.me\/|@)([a-zA-Z0-9_]+)/)
  if (match) return `@${match[1]}`
  if (s.startsWith('@')) return s
  return `@${s}`
}

// POST /api/telegram/verify-channel
// Checks that @CreatorsLinkBot is an admin of the given channel, then saves it.
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { creatorId, channelUsername } = parsed.data

  // Ensure the creator belongs to this user
  const c = await db.query.creator.findFirst({ where: eq(creator.id, creatorId) })
  if (!c || c.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const botToken = process.env['TELEGRAM_BOT_TOKEN']
  if (!botToken) {
    return NextResponse.json({ error: 'Telegram bot not configured' }, { status: 503 })
  }

  const channel = normaliseChannel(channelUsername)

  // 1. Get channel info to obtain the numeric id and title
  const chatRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(channel)}`,
  )
  const chatData = await chatRes.json()

  if (!chatData.ok) {
    return NextResponse.json(
      { error: 'Canal não encontrado. Verifique o username e tente novamente.' },
      { status: 422 },
    )
  }

  const chat = chatData.result
  const channelId = String(chat.id)
  const channelTitle = chat.title ?? channel

  // 2. Get bot info to know its user id
  const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
  const meData = await meRes.json()
  if (!meData.ok) return NextResponse.json({ error: 'Bot error' }, { status: 503 })
  const botId = meData.result.id

  // 3. Check that the bot is an admin of the channel
  const adminsRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getChatAdministrators?chat_id=${encodeURIComponent(channelId)}`,
  )
  const adminsData = await adminsRes.json()

  if (!adminsData.ok) {
    return NextResponse.json(
      { error: 'Não foi possível verificar os administradores. O canal é público?' },
      { status: 422 },
    )
  }

  const isAdmin = adminsData.result.some(
    (m: { user: { id: number }; status: string }) =>
      m.user.id === botId && (m.status === 'administrator' || m.status === 'creator'),
  )

  if (!isAdmin) {
    return NextResponse.json(
      {
        error:
          'O bot ainda não é administrador desse canal. Adicione-o como admin e tente novamente.',
      },
      { status: 422 },
    )
  }

  // 4. Save channel id and title on the creator
  await db
    .update(creator)
    .set({ telegramChannelId: channelId, telegramChannelTitle: channelTitle, updatedAt: new Date() })
    .where(eq(creator.id, creatorId))

  return NextResponse.json({ ok: true, channelId, channelTitle })
}

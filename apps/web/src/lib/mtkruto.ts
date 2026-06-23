// MTKruto client — authenticated as the Creators Link user account.
// Used to create Telegram channels on behalf of creators.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Client } from '@mtkruto/node'

const API_ID = parseInt(process.env['TELEGRAM_API_ID'] ?? '', 10)
const API_HASH = process.env['TELEGRAM_API_HASH'] ?? ''
const AUTH_STRING = process.env['TELEGRAM_USER_AUTH_STRING'] ?? ''

let _client: Client | null = null
let _connecting = false

export async function getTelegramClient(): Promise<Client> {
  if (_client) return _client
  if (_connecting) {
    await new Promise<void>((resolve) => {
      const iv = setInterval(() => { if (!_connecting) { clearInterval(iv); resolve() } }, 50)
    })
    return _client!
  }

  if (!API_ID || !API_HASH || !AUTH_STRING) {
    throw new Error('Telegram user credentials not configured. Run scripts/telegram-login.mjs first.')
  }

  _connecting = true
  try {
    const client = new Client({ apiId: API_ID, apiHash: API_HASH })
    await client.importAuthString(AUTH_STRING)
    await client.start()
    _client = client
    return client
  } finally {
    _connecting = false
  }
}

export type CreateChannelResult = {
  channelId: string
  title: string
  inviteLink: string
}

const ADMIN_RIGHTS = {
  _: 'chatAdminRights',
  change_info: true,
  post_messages: true,
  edit_messages: true,
  delete_messages: true,
  ban_users: true,
  invite_users: true,
  pin_messages: true,
  manage_call: true,
  other: true,
  manage_topics: true,
} as const

export async function createTelegramChannel(params: {
  title: string
  description?: string
  botUsername: string
  photoPath?: string       // path relative to public/ e.g. "avatars/uuid.jpg"
  creatorUsername?: string // Telegram @username to add as admin
}): Promise<CreateChannelResult> {
  const client = await getTelegramClient()

  // 1. Create the channel
  const created = await client.invoke({
    _: 'channels.createChannel',
    title: params.title,
    about: params.description ?? '',
    broadcast: true,
  }) as { chats: Array<{ id: bigint | number; access_hash?: bigint }> }

  const chat = created.chats?.[0]
  if (!chat) throw new Error('Channel creation returned no chat object')

  const rawId = typeof chat.id === 'bigint' ? chat.id : BigInt(chat.id)
  const accessHash = chat.access_hash ?? 0n
  const channelId = `-100${rawId.toString()}`

  const inputChannel = {
    _: 'inputChannel',
    channel_id: rawId,
    access_hash: accessHash,
  } as const

  // 2. Add bot as admin
  const botUsername = params.botUsername.replace('@', '')
  try {
    const resolved = await client.invoke({
      _: 'contacts.resolveUsername',
      username: botUsername,
    }) as { users: Array<{ id: bigint | number; access_hash?: bigint }> }

    const botUser = resolved.users?.[0]
    if (botUser) {
      const botId = typeof botUser.id === 'bigint' ? botUser.id : BigInt(botUser.id)
      await client.invoke({
        _: 'channels.editAdmin',
        channel: inputChannel,
        user_id: { _: 'inputUser', user_id: botId, access_hash: botUser.access_hash ?? 0n },
        admin_rights: ADMIN_RIGHTS,
        rank: 'Bot',
      })
    }
  } catch (err) {
    console.error('[mtkruto] failed to add bot as admin:', err)
  }

  // 3. Add creator as admin (if username provided)
  if (params.creatorUsername) {
    const creatorUname = params.creatorUsername.replace('@', '')
    try {
      const resolved = await client.invoke({
        _: 'contacts.resolveUsername',
        username: creatorUname,
      }) as { users: Array<{ id: bigint | number; access_hash?: bigint }> }

      const creatorUser = resolved.users?.[0]
      if (creatorUser) {
        const creatorId = typeof creatorUser.id === 'bigint' ? creatorUser.id : BigInt(creatorUser.id)
        await client.invoke({
          _: 'channels.editAdmin',
          channel: inputChannel,
          user_id: { _: 'inputUser', user_id: creatorId, access_hash: creatorUser.access_hash ?? 0n },
          admin_rights: ADMIN_RIGHTS,
          rank: 'Criadora',
        })
      }
    } catch (err) {
      console.error('[mtkruto] failed to add creator as admin:', err)
    }
  }

  // 4. Set channel photo (if provided)
  if (params.photoPath) {
    try {
      const publicDir = join(process.cwd(), 'public')
      // strip leading slash if present
      const relPath = params.photoPath.replace(/^\//, '')
      const fileBytes = await readFile(join(publicDir, relPath))
      const uploaded = await client.invoke({
        _: 'upload.saveFilePart',
        file_id: BigInt(Date.now()),
        file_part: 0,
        bytes: fileBytes,
      }) as { _: string }

      if (uploaded) {
        await client.invoke({
          _: 'channels.editPhoto',
          channel: inputChannel,
          photo: {
            _: 'inputChatUploadedPhoto',
            file: {
              _: 'inputFile',
              id: BigInt(Date.now()),
              parts: 1,
              name: relPath.split('/').pop() ?? 'photo.jpg',
              md5_checksum: '',
            },
          },
        }).catch((err: unknown) => console.error('[mtkruto] editPhoto failed:', err))
      }
    } catch (err) {
      console.error('[mtkruto] failed to set channel photo:', err)
    }
  }

  // 5. Generate invite link for the creator
  const exportedLink = await client.invoke({
    _: 'messages.exportChatInvite',
    peer: { _: 'inputPeerChannel', channel_id: rawId, access_hash: accessHash },
  }) as { link?: string }

  // 6. Leave the channel
  await client.invoke({
    _: 'channels.leaveChannel',
    channel: inputChannel,
  }).catch(() => null)

  return { channelId, title: params.title, inviteLink: exportedLink.link ?? '' }
}

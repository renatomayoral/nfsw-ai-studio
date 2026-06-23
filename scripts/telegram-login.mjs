/**
 * Run once to authenticate the Creators Link Telegram account.
 * Saves the auth string to stdout — copy it to TELEGRAM_USER_AUTH_STRING in .env
 *
 * Usage:
 *   node scripts/telegram-login.mjs
 */

import { createInterface } from 'node:readline'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Resolve @mtkruto/node from apps/web where it's installed
const mtkrutoPath = resolve(__dirname, '../apps/web/node_modules/@mtkruto/node/script/mod.js')
const { Client } = await import(mtkrutoPath)

const rl = createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((resolve) => rl.question(q, resolve))

const API_ID = parseInt(process.env.TELEGRAM_API_ID ?? '', 10)
const API_HASH = process.env.TELEGRAM_API_HASH ?? ''

if (!API_ID || !API_HASH) {
  console.error('Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env first.')
  console.error('Get them at https://my.telegram.org/apps')
  process.exit(1)
}

const client = new Client({ apiId: API_ID, apiHash: API_HASH })

await client.start({
  phone: () => ask('Phone number (with country code, e.g. +5511999999999): '),
  code: () => ask('Verification code: '),
  password: () => ask('2FA password (leave blank if none): '),
})

const authString = await client.exportAuthString()
console.log('\n✅ Authentication successful!\n')
console.log('Add this to your .env:\n')
console.log(`TELEGRAM_USER_AUTH_STRING=${authString}`)
console.log()

await client.disconnect()
rl.close()

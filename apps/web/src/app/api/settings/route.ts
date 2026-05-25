import { NextRequest, NextResponse } from 'next/server'
import { AppSettingsSchema } from '@repo/shared/types'

// In a real app, settings would be persisted to a DB or config file
// For now, we validate and acknowledge
export async function POST(req: NextRequest) {
  const body = await req.json() as unknown
  const parsed = AppSettingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // TODO: persist settings (e.g., to a local JSON file or environment)
  return NextResponse.json({ ok: true })
}

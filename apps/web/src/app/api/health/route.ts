import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@repo/comfyui-client'

export async function GET() {
  const client = new ComfyUIClient(
    process.env['COMFYUI_URL'] ?? 'http://localhost:8188',
  )

  const comfyui = await client.ping()

  return NextResponse.json({
    ok: true,
    comfyui,
    timestamp: new Date().toISOString(),
  })
}

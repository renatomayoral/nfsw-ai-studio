import { NextResponse } from 'next/server'
import { ensureTunnel, stopTunnel, getTunnelState } from '@/lib/comfyui-tunnel'

/** GET /api/comfyui/tunnel — status do tunnel */
export async function GET() {
  const state = getTunnelState()
  return NextResponse.json({ state })
}

/** POST /api/comfyui/tunnel — inicia tunnel */
export async function POST() {
  try {
    await ensureTunnel()
    return NextResponse.json({ state: 'ready' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ state: 'error', error: message }, { status: 503 })
  }
}

/** DELETE /api/comfyui/tunnel — para tunnel */
export async function DELETE() {
  stopTunnel()
  return NextResponse.json({ state: 'idle' })
}

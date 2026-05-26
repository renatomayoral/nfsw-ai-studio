/**
 * ComfyUI root proxy — GET /api/comfyui/
 * Proxies the ComfyUI HTML index page so the iframe can load it.
 * ([...path] requires ≥1 segment, so the root needs its own handler)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { ensureTunnel } from '@/lib/comfyui-tunnel'

const COMFYUI_BASE = 'http://127.0.0.1:8188'

export async function GET(req: NextRequest) {
  try {
    await ensureTunnel()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tunnel failed'
    return new NextResponse(
      `<html><body style="background:#111;color:#f87171;font-family:sans-serif;padding:2rem">
        <h2>ComfyUI Unavailable</h2><p>${message}</p>
       </body></html>`,
      { status: 503, headers: { 'content-type': 'text/html' } },
    )
  }

  try {
    const search = req.nextUrl.search ?? ''
    const response = await fetch(`${COMFYUI_BASE}/${search}`, {
      headers: { accept: 'text/html,*/*' },
    })

    const resHeaders = new Headers()
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'content-security-policy'].includes(key.toLowerCase())) {
        resHeaders.set(key, value)
      }
    })
    // Allow iframe from same origin
    resHeaders.set('x-frame-options', 'SAMEORIGIN')

    return new NextResponse(response.body, {
      status: response.status,
      headers: resHeaders,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'ComfyUI request failed', detail: message }, { status: 502 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ComfyUIClient } from '@repo/comfyui-client'
import { createFLUXWorkflow, createWanT2VWorkflow, createWanI2VWorkflow } from '@repo/comfyui-client/workflows'
import { auth } from '@repo/auth'
import {
  checkAnonymousQuota,
  checkUserQuota,
  buildAnonCookie,
} from '@/lib/quota'

const generateSchema = z.object({
  model: z.enum(['flux', 'wan-t2v', 'wan-i2v']),
  prompt: z.string().min(1).max(2000),
  negativePrompt: z.string().max(1000).optional(),
  width: z.number().min(256).max(2048).default(1024),
  height: z.number().min(256).max(2048).default(1024),
  steps: z.number().min(1).max(100).default(20),
  cfg: z.number().min(1).max(30).default(3.5),
  seed: z.number().default(() => Math.floor(Math.random() * 2 ** 32)),
  frames: z.number().min(16).max(200).optional(),
  imageBase64: z.string().optional(),
  /** Set to true by free-tier users consuming their one-time welcome video */
  useWelcomeVideo: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown
  const parsed = generateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const generationType = data.model === 'flux' ? 'image' : 'video'

  // ── Resolve session ───────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: req.headers })

  // ── Quota check ───────────────────────────────────────────────────────────
  let queue: 'fast' | 'slow' = 'fast'
  let anonCookieHeader: string | null = null

  if (!session) {
    // Anonymous user
    const result = await checkAnonymousQuota(req, generationType)
    anonCookieHeader = buildAnonCookie(result.anonId)

    if (!result.allowed) {
      const res = NextResponse.json(
        { error: result.reason, tier: result.tier, upgradeUrl: '/login' },
        { status: 429 },
      )
      res.headers.set('Set-Cookie', buildAnonCookie(result.anonId))
      return res
    }

    queue = result.queue

    // Anonymous users cannot exceed resolution limit (512px)
    const maxPx = result.limits.maxResolutionPx
    if (data.width > maxPx || data.height > maxPx) {
      return NextResponse.json(
        { error: `Resolução máxima para usuários anônimos é ${maxPx}px. Crie uma conta para desbloquear.` },
        { status: 403 },
      )
    }

    // Anonymous users cannot use I2V
    if (data.model === 'wan-i2v') {
      return NextResponse.json(
        { error: 'Image-to-Video requer conta. Crie uma conta grátis para testar.' },
        { status: 403 },
      )
    }
  } else {
    // Authenticated user
    const result = await checkUserQuota(
      session.user.id,
      generationType,
      data.useWelcomeVideo,
    )

    if (!result.allowed) {
      return NextResponse.json(
        { error: result.reason, tier: result.tier, upgradeUrl: '/settings' },
        { status: 429 },
      )
    }

    queue = result.queue

    // Enforce resolution limit per plan
    const maxPx = result.limits.maxResolutionPx
    if (data.width > maxPx || data.height > maxPx) {
      return NextResponse.json(
        { error: `Resolução máxima para seu plano é ${maxPx}px. Faça upgrade para desbloquear.` },
        { status: 403 },
      )
    }

    // Enforce I2V access
    if (data.model === 'wan-i2v' && !result.limits.i2v) {
      return NextResponse.json(
        { error: 'Image-to-Video está disponível nos planos Creator e Pro.' },
        { status: 403 },
      )
    }
  }

  // ── Build workflow ────────────────────────────────────────────────────────
  if (data.model === 'wan-i2v' && !data.imageBase64) {
    return NextResponse.json(
      { error: 'imageBase64 é obrigatório para I2V' },
      { status: 400 },
    )
  }

  const client = new ComfyUIClient(
    process.env['COMFYUI_URL'] ?? 'http://localhost:8188',
  )

  let workflow
  if (data.model === 'flux') {
    workflow = createFLUXWorkflow(data)
  } else if (data.model === 'wan-t2v') {
    workflow = createWanT2VWorkflow({ ...data, frames: data.frames ?? 81 })
  } else {
    workflow = createWanI2VWorkflow({
      ...data,
      frames: data.frames ?? 81,
      imageBase64: data.imageBase64!,
    })
  }

  // ── Submit to ComfyUI ─────────────────────────────────────────────────────
  try {
    const jobId = await client.submitWorkflow(workflow)

    const res = NextResponse.json({
      jobId,
      queue,
      // Inform the UI whether watermark will be applied
      watermark: session ? false : true,
    })

    if (anonCookieHeader) {
      res.headers.set('Set-Cookie', anonCookieHeader)
    }

    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Falha ao submeter para ComfyUI. A instância GPU está online?' },
      { status: 503 },
    )
  }
}

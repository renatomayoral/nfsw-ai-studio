import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ComfyUIClient } from '@repo/comfyui-client'
import { createFLUXWorkflow, createWanT2VWorkflow, createWanI2VWorkflow } from '@repo/comfyui-client/workflows'

const generateSchema = z.object({
  model: z.enum(['flux', 'wan-t2v', 'wan-i2v']),
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  width: z.number().min(256).max(2048).default(1024),
  height: z.number().min(256).max(2048).default(1024),
  steps: z.number().min(1).max(100).default(20),
  cfg: z.number().min(1).max(30).default(3.5),
  seed: z.number().default(() => Math.floor(Math.random() * 2 ** 32)),
  frames: z.number().min(16).max(200).optional(),
  imageBase64: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown
  const parsed = generateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const client = new ComfyUIClient(
    process.env['COMFYUI_URL'] ?? 'http://localhost:8188',
  )

  let workflow
  if (data.model === 'flux') {
    workflow = createFLUXWorkflow(data)
  } else if (data.model === 'wan-t2v') {
    workflow = createWanT2VWorkflow({ ...data, frames: data.frames ?? 81 })
  } else {
    if (!data.imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 required for I2V' },
        { status: 400 },
      )
    }
    workflow = createWanI2VWorkflow({
      ...data,
      frames: data.frames ?? 81,
      imageBase64: data.imageBase64,
    })
  }

  try {
    const jobId = await client.submitWorkflow(workflow)
    return NextResponse.json({ jobId })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to submit to ComfyUI' },
      { status: 503 },
    )
  }
}

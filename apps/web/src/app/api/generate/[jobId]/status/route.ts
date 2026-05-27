import { NextRequest } from 'next/server'
import { ComfyUIClient } from '@repo/comfyui-client'
import { GCSStorage } from '@repo/gcs-storage'

const COMFYUI_BASE = 'http://127.0.0.1:8188'

/** Fetch raw bytes from ComfyUI output via the tunnel */
async function fetchOutputFile(filename: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const url = `${COMFYUI_BASE}/view?filename=${encodeURIComponent(filename)}&type=output`
    console.log(`[status] fetching output file: ${url}`)
    const res = await fetch(url, {
      headers: { origin: COMFYUI_BASE, referer: `${COMFYUI_BASE}/` },
    })
    if (!res.ok) {
      console.error(`[status] fetchOutputFile failed: HTTP ${res.status} for ${filename}`)
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
    console.log(`[status] fetched ${filename}: ${buffer.length} bytes, type=${contentType}`)
    return { buffer, contentType }
  } catch (err) {
    console.error(`[status] fetchOutputFile error for ${filename}:`, err)
    return null
  }
}

/** Delete a file from ComfyUI's output folder via its API */
async function deleteFromComfyUI(filename: string): Promise<void> {
  try {
    await fetch(`${COMFYUI_BASE}/api/free`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: COMFYUI_BASE,
        referer: `${COMFYUI_BASE}/`,
      },
      body: JSON.stringify({ unload_models: false, free_memory: false, output_files: [filename] }),
    })
  } catch {
    // Non-critical — GCS is the source of truth
  }
}

/**
 * Free GPU activation memory after a generation (completed or failed).
 * Does NOT unload models — they stay in VRAM for the next run.
 * Prevents VRAM accumulation from intermediate tensors across multiple runs.
 */
async function freeGpuMemory(): Promise<void> {
  try {
    await fetch(`${COMFYUI_BASE}/api/free`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: COMFYUI_BASE,
        referer: `${COMFYUI_BASE}/`,
      },
      body: JSON.stringify({ unload_models: false, free_memory: true }),
    })
    console.log('[status] GPU memory freed')
  } catch {
    // Non-critical
  }
}

/**
 * Upload the file to GCS, delete it from the VM, and return a signed URL.
 * Falls back to the Next.js proxy URL if GCS upload fails.
 */
async function uploadAndGetUrl(
  filename: string,
  outputType: 'image' | 'video',
  provider: string,
): Promise<string> {
  const proxyFallback = `/api/comfyui/view?filename=${encodeURIComponent(filename)}&type=output`

  const file = await fetchOutputFile(filename)
  if (!file) {
    console.warn(`[status] could not fetch ${filename} from ComfyUI — using proxy fallback`)
    return proxyFallback
  }

  try {
    const storage = new GCSStorage()
    const gcsPath = `${provider}/${filename}`
    console.log(`[status] uploading to GCS: gs://.../${gcsPath}`)
    await storage.uploadBuffer(file.buffer, gcsPath, file.contentType, {
      generatedAt: new Date().toISOString(),
      provider,
      type: outputType,
    })
    console.log(`[status] GCS upload OK: ${gcsPath}`)
    await deleteFromComfyUI(filename)
    const url = await storage.getDownloadUrl(gcsPath, 3600)
    console.log(`[status] signed URL obtained`)
    return url
  } catch (err) {
    console.error(`[status] GCS upload failed for ${filename}:`, err)
    return proxyFallback
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  const comfyUrl  = process.env['COMFYUI_URL'] ?? COMFYUI_BASE
  const client    = new ComfyUIClient(comfyUrl)
  const provider  = process.env['CLOUD_PROVIDER'] ?? 'gcp'

  console.log(`[status] polling job ${jobId} via ${comfyUrl}`)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      let attempts    = 0
      const maxAttempts = 300  // 5 min at 1s intervals

      while (attempts < maxAttempts) {
        let output
        try {
          output = await client.getJobOutput(jobId)
        } catch (err) {
          console.error(`[status] getJobOutput error (attempt ${attempts}):`, err)
          send({ status: 'failed', percentage: 0, error: 'ComfyUI unreachable' })
          break
        }

        console.log(`[status] attempt ${attempts}: status=${output.status}, images=${output.images?.length ?? 0}, videos=${output.videos?.length ?? 0}`)

        if (output.status === 'completed') {
          const firstVideo = output.videos?.[0]
          const firstImage = output.images?.[0]

          console.log(`[status] completed — firstImage=${firstImage?.filename}, firstVideo=${firstVideo?.filename}`)

          let outputUrl:  string | undefined
          let outputType: 'image' | 'video' = 'image'

          if (firstVideo) {
            outputType = 'video'
            outputUrl  = await uploadAndGetUrl(firstVideo.filename, 'video', provider)
          } else if (firstImage) {
            outputUrl  = await uploadAndGetUrl(firstImage.filename, 'image', provider)
          } else {
            console.warn(`[status] job completed but no output files found`)
          }

          send({ status: 'completed', percentage: 100, outputUrl, outputType })
          await freeGpuMemory()
          break
        }

        if (output.status === 'failed') {
          console.error(`[status] job failed: ${output.error ?? 'no reason'}`)
          send({ status: 'failed', percentage: 0 })
          await freeGpuMemory()
          break
        }

        send({ status: output.status, percentage: Math.min(attempts * 2, 95) })
        await new Promise((r) => setTimeout(r, 1_000))
        attempts++
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
    },
  })
}

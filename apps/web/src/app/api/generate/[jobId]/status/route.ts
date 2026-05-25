import { NextRequest } from 'next/server'
import { ComfyUIClient } from '@repo/comfyui-client'
import { GCSStorage } from '@repo/gcs-storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  const client = new ComfyUIClient(
    process.env['COMFYUI_URL'] ?? 'http://localhost:8188',
  )
  const storage = new GCSStorage()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        )
      }

      // Poll job status
      let attempts = 0
      const maxAttempts = 300 // 5 min at 1s intervals

      while (attempts < maxAttempts) {
        const output = await client.getJobOutput(jobId)

        if (output.status === 'completed') {
          // Try to get signed URL for the first output file
          let outputUrl: string | undefined
          let outputType: 'image' | 'video' = 'image'

          const firstImage = output.images?.[0]
          const firstVideo = output.videos?.[0]

          if (firstVideo) {
            outputType = 'video'
            try {
              const gcsPath = `${process.env['CLOUD_PROVIDER'] ?? 'gcp'}/${firstVideo.filename}`
              outputUrl = await storage.getDownloadUrl(gcsPath)
            } catch {
              outputUrl = `${process.env['COMFYUI_URL'] ?? 'http://localhost:8188'}/view?filename=${firstVideo.filename}`
            }
          } else if (firstImage) {
            try {
              const gcsPath = `${process.env['CLOUD_PROVIDER'] ?? 'gcp'}/${firstImage.filename}`
              outputUrl = await storage.getDownloadUrl(gcsPath)
            } catch {
              outputUrl = `${process.env['COMFYUI_URL'] ?? 'http://localhost:8188'}/view?filename=${firstImage.filename}`
            }
          }

          send({
            status: 'completed',
            percentage: 100,
            outputUrl,
            outputType,
          })
          break
        }

        if (output.status === 'failed') {
          send({ status: 'failed', percentage: 0 })
          break
        }

        send({ status: output.status, percentage: Math.min(attempts * 2, 95) })
        await new Promise((r) => setTimeout(r, 1000))
        attempts++
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

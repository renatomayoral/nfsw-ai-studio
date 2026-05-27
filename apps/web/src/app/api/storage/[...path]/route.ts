import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@repo/auth'
import { GCSStorage } from '@repo/gcs-storage'

/**
 * GET /api/storage/[...path]
 *
 * Authenticated GCS proxy — downloads any file from the outputs bucket
 * using server-side ADC (no signed URLs needed).
 *
 * Works with:
 *  - Local dev: `gcloud auth application-default login`
 *  - GCE / Cloud Run: attached service account
 *
 * Auth: requires an active session.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await params
  const gcsPath  = path.join('/')
  const filename = path[path.length - 1] ?? gcsPath

  try {
    const storage = new GCSStorage()
    const { buffer, contentType } = await storage.downloadFile(gcsPath)

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type':        contentType,
        'Cache-Control':       'private, max-age=3600',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storage error'
    console.error('[storage-proxy]', message)
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

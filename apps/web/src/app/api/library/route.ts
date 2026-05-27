import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GCSStorage } from '@repo/gcs-storage'
import type { AssetFilter } from '@repo/shared/types'

const TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

const filterSchema = z.object({
  type: z.enum(['image', 'video', 'all']).optional(),
  provider: z.enum(['gcp', 'runpod']).optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
  offset: z.coerce.number().min(0).optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = filterSchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const storage = new GCSStorage()
  const filter: AssetFilter = {
    ...parsed.data,
    limit: parsed.data.limit ?? 100,
  }

  try {
    const assets = await withTimeout(storage.listAssets(filter), TIMEOUT_MS, [])

    // Attach download URLs.
    // Strategy: try signed URL first (works in production with a service account);
    // fall back to the Next.js GCS proxy which works with ADC locally.
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        const proxyUrl = `/api/storage/${asset.gcsPath}`
        try {
          const signedUrl = await withTimeout(
            storage.getDownloadUrl(asset.gcsPath, 3600),
            3000,
            null as unknown as string,
          )
          return { ...asset, downloadUrl: signedUrl ?? proxyUrl }
        } catch {
          return { ...asset, downloadUrl: proxyUrl }
        }
      }),
    )

    return NextResponse.json(assetsWithUrls)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to list assets' },
      { status: 500 },
    )
  }
}

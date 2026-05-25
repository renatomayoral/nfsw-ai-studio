import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GCSStorage } from '@repo/gcs-storage'
import type { AssetFilter } from '@repo/shared/types'

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
    const assets = await storage.listAssets(filter)

    // Generate signed URLs for images (for thumbnails)
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        if (asset.type === 'image') {
          try {
            const url = await storage.getDownloadUrl(asset.gcsPath, 3600)
            return { ...asset, downloadUrl: url }
          } catch {
            return asset
          }
        }
        return asset
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

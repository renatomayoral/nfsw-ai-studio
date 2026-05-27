import { NextRequest, NextResponse } from 'next/server'
import { GCSStorage } from '@repo/gcs-storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const gcsPath = Buffer.from(id, 'base64url').toString()

  try {
    const storage = new GCSStorage()
    const asset   = await storage.getAsset(gcsPath)

    // Try signed URL (production with service account); fall back to GCS proxy (ADC locally)
    let url: string
    try {
      url = await storage.getDownloadUrl(asset.gcsPath, 3600)
    } catch {
      url = `/api/storage/${asset.gcsPath}`
    }

    return NextResponse.json({ url })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 },
    )
  }
}

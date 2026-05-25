import { NextRequest, NextResponse } from 'next/server'
import { GCSStorage } from '@repo/gcs-storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const storage = new GCSStorage()
    const asset = await storage.getAsset(
      Buffer.from(id, 'base64url').toString(),
    )
    const url = await storage.getDownloadUrl(asset.gcsPath, 3600)
    return NextResponse.json({ url })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 },
    )
  }
}

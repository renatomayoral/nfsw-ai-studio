import { NextRequest, NextResponse } from 'next/server'
import { GCSStorage } from '@repo/gcs-storage'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const storage = new GCSStorage()
    const gcsPath = Buffer.from(id, 'base64url').toString()
    await storage.deleteAsset(gcsPath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 },
    )
  }
}

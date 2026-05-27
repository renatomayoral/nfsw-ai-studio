import { NextRequest, NextResponse } from 'next/server'
import { GCSStorage } from '@repo/gcs-storage'
import { auth } from '@repo/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const gcsPath = Buffer.from(id, 'base64url').toString()
    console.log(`[library] DELETE gcsPath=${gcsPath}`)
    const storage = new GCSStorage()
    await storage.deleteAsset(gcsPath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[library] DELETE error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete asset' },
      { status: 500 },
    )
  }
}

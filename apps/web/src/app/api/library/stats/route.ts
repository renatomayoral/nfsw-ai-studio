import { NextResponse } from 'next/server'
import { GCSStorage } from '@repo/gcs-storage'

export async function GET() {
  try {
    const storage = new GCSStorage()
    const stats = await storage.getStorageStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to get storage stats' },
      { status: 500 },
    )
  }
}

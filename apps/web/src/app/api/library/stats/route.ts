import { NextResponse } from 'next/server'
import { GCSStorage } from '@repo/gcs-storage'
import type { StorageStats } from '@repo/shared/types'

const TIMEOUT_MS = 5000

const FALLBACK: StorageStats = {
  totalFiles: 0,
  totalSizeBytes: 0,
  imageCount: 0,
  videoCount: 0,
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

export async function GET() {
  try {
    const storage = new GCSStorage()
    const stats = await withTimeout(storage.getStorageStats(), TIMEOUT_MS, FALLBACK)
    return NextResponse.json(stats)
  } catch (err) {
    console.error(err)
    return NextResponse.json(FALLBACK)
  }
}

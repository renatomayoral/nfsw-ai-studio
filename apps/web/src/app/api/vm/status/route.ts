import { NextResponse } from 'next/server'
import { GCPProvider } from '@repo/cloud-infra/gcp'
import { RunPodProvider } from '@repo/cloud-infra/runpod'

const TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

function getProvider() {
  const cloud = process.env['CLOUD_PROVIDER'] ?? 'gcp'
  if (cloud === 'runpod') {
    return new RunPodProvider({ apiKey: process.env['RUNPOD_API_KEY'] ?? '' })
  }
  return new GCPProvider({
    projectId: process.env['GCP_PROJECT'] ?? 'mktia-ai-studio',
    zone: process.env['GCP_ZONE'] ?? 'us-central1-a',
  })
}

export async function GET() {
  try {
    const provider = getProvider()
    const instanceId =
      process.env['CLOUD_PROVIDER'] === 'runpod'
        ? (process.env['RUNPOD_POD_ID'] ?? '')
        : (process.env['GCP_INSTANCE_NAME'] ?? '')

    const [status, metrics] = await Promise.all([
      withTimeout(provider.getStatus(instanceId), TIMEOUT_MS, 'UNKNOWN' as const),
      withTimeout(provider.getMetrics(instanceId).catch(() => null), TIMEOUT_MS, null),
    ])

    return NextResponse.json({ status, metrics })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ status: 'UNKNOWN', metrics: null })
  }
}

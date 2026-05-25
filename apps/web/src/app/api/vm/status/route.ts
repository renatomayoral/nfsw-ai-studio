import { NextResponse } from 'next/server'
import { GCPProvider } from '@repo/cloud-infra/gcp'
import { RunPodProvider } from '@repo/cloud-infra/runpod'

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
      provider.getStatus(instanceId),
      provider.getMetrics(instanceId).catch(() => null),
    ])

    return NextResponse.json({ status, metrics })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ status: 'UNKNOWN', metrics: null })
  }
}

import { NextResponse } from 'next/server'
import { GCPProvider } from '@repo/cloud-infra/gcp'
import { RunPodProvider } from '@repo/cloud-infra/runpod'

export async function POST() {
  try {
    const cloud = process.env['CLOUD_PROVIDER'] ?? 'gcp'
    const instanceId =
      cloud === 'runpod'
        ? (process.env['RUNPOD_POD_ID'] ?? '')
        : (process.env['GCP_INSTANCE_NAME'] ?? '')

    if (cloud === 'runpod') {
      const provider = new RunPodProvider({
        apiKey: process.env['RUNPOD_API_KEY'] ?? '',
      })
      await provider.stopInstance(instanceId)
    } else {
      const provider = new GCPProvider({
        projectId: process.env['GCP_PROJECT'] ?? 'mktia-ai-studio',
        zone: process.env['GCP_ZONE'] ?? 'us-central1-a',
      })
      await provider.stopInstance(instanceId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to stop' }, { status: 500 })
  }
}

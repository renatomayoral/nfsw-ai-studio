import { NextResponse } from 'next/server'
import { GCPProvider } from '@repo/cloud-infra/gcp'
import { RunPodProvider } from '@repo/cloud-infra/runpod'

export async function POST() {
  try {
    const cloud = process.env['CLOUD_PROVIDER'] ?? 'gcp'

    if (cloud === 'runpod') {
      const provider = new RunPodProvider({
        apiKey: process.env['RUNPOD_API_KEY'] ?? '',
      })
      const podId = process.env['RUNPOD_POD_ID'] ?? ''
      if (podId) {
        const status = await provider.startInstance(podId)
        return NextResponse.json({ status })
      }
      // Create new pod
      const instance = await provider.createInstance({
        name: 'ai-studio',
        gpuCount: 1,
        diskSizeGb: 200,
      })
      return NextResponse.json({ status: 'STARTING', instance })
    }

    const provider = new GCPProvider({
      projectId: process.env['GCP_PROJECT'] ?? 'mktia-ai-studio',
      zone: process.env['GCP_ZONE'] ?? 'us-central1-a',
    })
    const status = await provider.startInstance(
      process.env['GCP_INSTANCE_NAME'] ?? '',
    )
    return NextResponse.json({ status })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to start instance' }, { status: 500 })
  }
}

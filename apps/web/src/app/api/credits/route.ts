import { NextResponse } from 'next/server'
import { GCPProvider } from '@repo/cloud-infra/gcp'
import { RunPodProvider } from '@repo/cloud-infra/runpod'

export async function GET() {
  try {
    const cloud = process.env['CLOUD_PROVIDER'] ?? 'gcp'

    let billing
    if (cloud === 'runpod') {
      const provider = new RunPodProvider({
        apiKey: process.env['RUNPOD_API_KEY'] ?? '',
      })
      billing = await provider.getBilling()
    } else {
      const provider = new GCPProvider({
        projectId: process.env['GCP_PROJECT'] ?? 'mktia-ai-studio',
        zone: process.env['GCP_ZONE'] ?? 'us-central1-a',
      })
      billing = await provider.getBilling()
    }

    return NextResponse.json(billing)
  } catch (err) {
    console.error(err)
    return NextResponse.json({
      creditRemainingUSD: 0,
      usedThisMonthUSD: 0,
      estimatedCostPerHour: 0,
    })
  }
}

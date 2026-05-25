import { NextResponse } from 'next/server'
import { GCPProvider } from '@repo/cloud-infra/gcp'
import { RunPodProvider } from '@repo/cloud-infra/runpod'
import type { BillingInfo } from '@repo/shared/types'

const TIMEOUT_MS = 5000

const FALLBACK: BillingInfo = {
  creditRemainingUSD: 0,
  usedThisMonthUSD: 0,
  estimatedCostPerHour: 0,
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

export async function GET() {
  try {
    const cloud = process.env['CLOUD_PROVIDER'] ?? 'gcp'

    let billing: BillingInfo
    if (cloud === 'runpod') {
      const provider = new RunPodProvider({
        apiKey: process.env['RUNPOD_API_KEY'] ?? '',
      })
      billing = await withTimeout(provider.getBilling(), TIMEOUT_MS, FALLBACK)
    } else {
      const provider = new GCPProvider({
        projectId: process.env['GCP_PROJECT'] ?? 'mktia-ai-studio',
        zone: process.env['GCP_ZONE'] ?? 'us-central1-a',
      })
      billing = await withTimeout(provider.getBilling(), TIMEOUT_MS, FALLBACK)
    }

    return NextResponse.json(billing)
  } catch (err) {
    console.error(err)
    return NextResponse.json(FALLBACK)
  }
}

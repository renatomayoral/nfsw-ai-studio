import { NextResponse } from 'next/server'
import { RunPodProvider } from '@repo/cloud-infra/runpod'

// DELETE — apenas RunPod (destruir pod)
export async function DELETE() {
  const cloud = process.env['CLOUD_PROVIDER'] ?? 'gcp'
  if (cloud !== 'runpod') {
    return NextResponse.json(
      { error: 'Delete only supported for RunPod' },
      { status: 400 },
    )
  }

  try {
    const provider = new RunPodProvider({
      apiKey: process.env['RUNPOD_API_KEY'] ?? '',
    })
    await provider.deleteInstance(process.env['RUNPOD_POD_ID'] ?? '')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete pod' }, { status: 500 })
  }
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Power, AlertCircle } from 'lucide-react'

type Phase =
  | 'checking'   // verifying VM status
  | 'starting'   // VM is stopped — calling /api/vm/start
  | 'tunneling'  // VM running — establishing SSH tunnel
  | 'ready'      // tunnel up — show ComfyUI iframe
  | 'error'

const POLL_INTERVAL_MS = 5_000

export default function StudioPage() {
  const [phase, setPhase] = useState<Phase>('checking')
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startTick() {
    setElapsed(0)
    tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }

  function stopTick() {
    if (tickRef.current) clearInterval(tickRef.current)
  }

  async function checkAndBoot() {
    try {
      // 1. Check VM status
      setPhase('checking')
      const statusRes = await fetch('/api/vm/status')
      const statusData = await statusRes.json()
      const vmStatus: string = statusData.status ?? 'UNKNOWN'

      if (vmStatus === 'STOPPED' || vmStatus === 'UNKNOWN') {
        // 2. Start the VM
        setPhase('starting')
        startTick()
        await fetch('/api/vm/start', { method: 'POST' })

        // 3. Poll until RUNNING
        await waitForStatus('RUNNING')
        stopTick()
      }

      // 4. Establish SSH tunnel
      setPhase('tunneling')
      startTick()
      const tunnelRes = await fetch('/api/comfyui/tunnel', { method: 'POST' })
      if (!tunnelRes.ok) {
        const d = await tunnelRes.json()
        throw new Error(d.error ?? 'Tunnel failed')
      }
      stopTick()

      // 5. Ready — show iframe
      setPhase('ready')
    } catch (err) {
      stopTick()
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPhase('error')
    }
  }

  async function waitForStatus(target: string) {
    return new Promise<void>((resolve, reject) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/vm/status')
          const data = await res.json()
          if (data.status === target) {
            clearInterval(pollRef.current!)
            resolve()
          }
        } catch {
          // keep polling
        }
      }, POLL_INTERVAL_MS)

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollRef.current!)
        reject(new Error('VM took too long to start (10 min timeout)'))
      }, 10 * 60 * 1000)
    })
  }

  useEffect(() => {
    checkAndBoot()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      stopTick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'ready') {
    return (
      <iframe
        src="/api/comfyui/"
        className="h-full w-full border-0"
        title="ComfyUI Studio"
        allow="clipboard-read; clipboard-write"
      />
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-neutral-950 text-white">
      {phase === 'error' ? (
        <>
          <AlertCircle className="h-12 w-12 text-red-400" />
          <div className="text-center">
            <p className="text-lg font-semibold text-red-400">Failed to start studio</p>
            <p className="mt-1 text-sm text-neutral-400">{error}</p>
          </div>
          <button
            onClick={() => { setError(null); checkAndBoot() }}
            className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <div className="relative">
            <Power className="h-10 w-10 text-neutral-400" />
            <Loader2 className="absolute -right-4 -top-4 h-6 w-6 animate-spin text-violet-400" />
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {phase === 'checking' && 'Checking VM status…'}
              {phase === 'starting' && 'Starting GPU VM…'}
              {phase === 'tunneling' && 'Connecting to ComfyUI…'}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {phase === 'starting' && `This usually takes 2–3 minutes · ${elapsed}s`}
              {phase === 'tunneling' && `Establishing SSH tunnel · ${elapsed}s`}
              {phase === 'checking' && 'Hang on a moment'}
            </p>
          </div>

          {phase === 'starting' && (
            <div className="w-64 overflow-hidden rounded-full bg-white/10 h-1.5">
              <div
                className="h-full bg-violet-500 transition-all duration-1000"
                style={{ width: `${Math.min((elapsed / 180) * 100, 95)}%` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

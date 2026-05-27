/**
 * VM lifecycle state — persists across client-side navigation via Zustand.
 *
 * The store owns the boot() logic so multiple components/pages can read the
 * same phase without re-triggering the boot sequence on every mount.
 */

import { create } from 'zustand'

export type VmPhase = 'idle' | 'checking' | 'starting' | 'tunneling' | 'ready' | 'offline' | 'error'

type VmStore = {
  phase:   VmPhase
  error:   string | null
  elapsed: number

  // Internal refs (not reactive, just held in the store closure)
  _pollTimer:   ReturnType<typeof setInterval> | null
  _tickTimer:   ReturnType<typeof setInterval> | null
  _healthTimer: ReturnType<typeof setInterval> | null
  _booting:     boolean   // prevents concurrent boot calls

  boot:  () => Promise<void>
  reset: () => void
}

const POLL_MS         = 5_000
const HEALTH_CHECK_MS = 30_000

export const useVmStore = create<VmStore>((set, get) => ({
  phase:   'idle',
  error:   null,
  elapsed: 0,

  _pollTimer:   null,
  _tickTimer:   null,
  _healthTimer: null,
  _booting:     false,

  reset() {
    const s = get()
    if (s._pollTimer)   clearInterval(s._pollTimer)
    if (s._tickTimer)   clearInterval(s._tickTimer)
    if (s._healthTimer) clearInterval(s._healthTimer)
    set({ phase: 'idle', error: null, elapsed: 0, _booting: false })
  },

  async boot() {
    const s = get()

    // Already ready — nothing to do
    if (s.phase === 'ready') return

    // Already booting — don't start a second concurrent boot
    if (s._booting) return

    // Clear any stale timers from a previous boot attempt
    if (s._pollTimer)   clearInterval(s._pollTimer)
    if (s._tickTimer)   clearInterval(s._tickTimer)
    if (s._healthTimer) clearInterval(s._healthTimer)

    set({ _booting: true, error: null })

    // ── Tick counter ────────────────────────────────────────────────────────
    const startTick = () => {
      set({ elapsed: 0 })
      const t = setInterval(() => set((prev) => ({ elapsed: prev.elapsed + 1 })), 1_000)
      set({ _tickTimer: t })
    }
    const stopTick = () => {
      const { _tickTimer } = get()
      if (_tickTimer) clearInterval(_tickTimer)
      set({ _tickTimer: null })
    }

    // ── Poll VM status until target ─────────────────────────────────────────
    const waitForStatus = (target: string) =>
      new Promise<void>((resolve, reject) => {
        const t = setInterval(async () => {
          try {
            const data: { status: string } = await fetch('/api/vm/status').then((r) => r.json())
            if (data.status === target) {
              clearInterval(t)
              set({ _pollTimer: null })
              resolve()
            }
          } catch { /* keep polling */ }
        }, POLL_MS)
        set({ _pollTimer: t })

        setTimeout(() => {
          clearInterval(t)
          set({ _pollTimer: null })
          reject(new Error('VM demorou mais de 10 min para iniciar'))
        }, 10 * 60 * 1_000)
      })

    // ── Health check while ready ────────────────────────────────────────────
    const startHealthCheck = () => {
      const t = setInterval(async () => {
        try {
          const data: { status: string } = await fetch('/api/vm/status').then((r) => r.json())
          if (data.status === 'STOPPED' || data.status === 'UNKNOWN') {
            clearInterval(t)
            set({ _healthTimer: null, phase: 'offline' })
          }
        } catch { /* network hiccup */ }
      }, HEALTH_CHECK_MS)
      set({ _healthTimer: t })
    }

    // ── Boot sequence ───────────────────────────────────────────────────────
    try {
      set({ phase: 'checking' })
      const { status }: { status: string } = await fetch('/api/vm/status').then((r) => r.json())

      if (status !== 'RUNNING') {
        set({ phase: 'starting' })
        startTick()
        await fetch('/api/vm/start', { method: 'POST' })
        await waitForStatus('RUNNING')
        stopTick()
      }

      set({ phase: 'tunneling' })
      startTick()
      const tunnelRes = await fetch('/api/comfyui/tunnel', { method: 'POST' })
      if (!tunnelRes.ok) {
        const d = await tunnelRes.json() as { error?: string }
        throw new Error(d.error ?? 'Tunnel failed')
      }
      stopTick()

      set({ phase: 'ready', _booting: false })
      startHealthCheck()
    } catch (err) {
      stopTick()
      set({
        phase:    'error',
        error:    err instanceof Error ? err.message : 'Erro desconhecido',
        _booting: false,
      })
    }
  },
}))

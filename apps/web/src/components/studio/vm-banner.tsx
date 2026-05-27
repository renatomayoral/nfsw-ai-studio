'use client'

import { Loader2, Power, AlertCircle, WifiOff } from 'lucide-react'
import { Progress } from '@repo/ui/components/progress'
import { useVmStore } from '@/lib/vm-store'

/**
 * Renders a contextual status banner while the VM is not ready.
 * Returns null when phase is 'ready' or 'idle' (no banner needed).
 * Reads directly from useVmStore — no props needed.
 */
export function VmBanner() {
  const { phase, error, elapsed, boot } = useVmStore()

  if (phase === 'ready' || phase === 'idle') return null

  if (phase === 'offline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5"
      >
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          GPU desligou por inatividade
        </div>
        <button
          onClick={() => void boot()}
          className="flex items-center gap-1.5 rounded-md bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none transition-colors"
          aria-label="Religar GPU"
        >
          <Power className="h-3 w-3" aria-hidden="true" />
          Religar
        </button>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div
        role="alert"
        className="flex items-center justify-between rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5"
      >
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error ?? 'Falha ao iniciar GPU'}</span>
        </div>
        <button
          onClick={() => void boot()}
          className="rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none transition-colors"
          aria-label="Tentar conectar novamente"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // checking / starting / tunneling
  const label =
    phase === 'checking'  ? 'Verificando GPU…' :
    phase === 'starting'  ? `Ligando GPU… ${elapsed}s` :
    /* tunneling */         `Conectando… ${elapsed}s`

  const progress = phase === 'starting' ? Math.min((elapsed / 180) * 100, 95) : null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex items-center gap-3 rounded-lg bg-white/4 border border-white/8 px-4 py-2.5 text-sm text-neutral-400"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      <span>{label}</span>
      {progress !== null && (
        <div className="ml-auto w-28">
          <Progress value={progress} className="h-1" />
        </div>
      )}
    </div>
  )
}

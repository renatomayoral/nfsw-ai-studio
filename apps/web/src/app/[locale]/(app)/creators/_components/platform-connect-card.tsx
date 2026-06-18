'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Unlink, ExternalLink } from 'lucide-react'
import type { ConnectedPlatform } from '@/lib/creators'

export type PlatformConnectConfig = {
  platform: string
  label: string
  color: string
  logo: React.ReactNode
  // OAuth flow: provide connectHref
  connectHref?: (creatorId: string) => string
  // Token flow: provide tokenForm
  tokenForm?: React.ComponentType<{ creatorId: string; onSuccess: () => void }>
  statusEndpoint: (creatorId: string) => string
  disconnectEndpoint: (creatorId: string) => string
  docsUrl?: string
  docsLabel?: string
}

type Status = {
  connected: boolean
  needsReauth?: boolean
  handle?: string
  platformUserId?: string
  scopes?: string[]
}

type Props = {
  creatorId: string
  config: PlatformConnectConfig
  initialConnection?: ConnectedPlatform
}

export function PlatformConnectCard({ creatorId, config, initialConnection }: Props) {
  const qc = useQueryClient()
  const key = [config.platform, 'status', creatorId]

  const initialStatus: Status | undefined = initialConnection
    ? { connected: true, needsReauth: initialConnection.expired, handle: initialConnection.handle ?? undefined, platformUserId: initialConnection.platformUserId ?? undefined }
    : { connected: false }

  const { data: status, isLoading } = useQuery<Status>({
    queryKey: key,
    queryFn: async () => {
      const res = await fetch(config.statusEndpoint(creatorId))
      if (res.status === 404) return { connected: false }
      return res.json()
    },
    initialData: initialStatus,
  })

  const disconnect = useMutation({
    mutationFn: () => fetch(config.disconnectEndpoint(creatorId), { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  if (isLoading) return <div className="h-16 animate-pulse rounded-2xl bg-border" />

  const isConnected = status?.connected && !status.needsReauth

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {config.logo}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-bold">{config.label}</span>
              {isConnected && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-bold text-emerald-400">
                  CONECTADO
                </span>
              )}
              {status?.needsReauth && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-bold text-amber-400">
                  RECONECTAR
                </span>
              )}
            </div>
            {isConnected && status?.handle && (
              <div className="text-[12px] text-muted-foreground">@{status.handle}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected && (
            <button
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400"
              title="Desconectar"
            >
              <Unlink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Not connected or needs reauth */}
      {(!isConnected) && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {/* OAuth button */}
          {config.connectHref && (
            <a
              href={`${config.connectHref(creatorId)}${status?.needsReauth ? '' : ''}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: config.color }}
            >
              {config.logo}
              {status?.needsReauth ? `Reconectar ${config.label}` : `Conectar com ${config.label}`}
            </a>
          )}

          {/* Token form */}
          {config.tokenForm && (
            <config.tokenForm
              creatorId={creatorId}
              onSuccess={() => qc.invalidateQueries({ queryKey: key })}
            />
          )}

          {config.docsUrl && (
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              {config.docsLabel ?? 'Como obter o token'}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

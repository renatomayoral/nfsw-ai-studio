'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PlatformConnectCard, type PlatformConnectConfig } from './platform-connect-card'

// Buy Me a Coffee logo
function BmacLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FFDD00" />
      <text x="4" y="22" fontSize="18" fill="#000">☕</text>
    </svg>
  )
}

function BmacTokenForm({ creatorId, onSuccess }: { creatorId: string; onSuccess: () => void }) {
  const [token, setToken] = useState('')

  const save = useMutation({
    mutationFn: () =>
      fetch('/api/buymeacoffee/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ creatorId, accessToken: token.trim() }),
      }).then(async (r) => {
        const body = await r.json()
        if (!r.ok) throw new Error(body.error ?? 'Erro ao salvar token')
        return body
      }),
    onSuccess: () => {
      setToken('')
      onSuccess()
    },
  })

  return (
    <div className="space-y-2">
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Cole seu Access Token do Buy Me a Coffee"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-[12px] outline-none focus:border-[#FFDD00]"
      />
      {save.error && (
        <p className="text-[12px] text-red-400">{(save.error as Error).message}</p>
      )}
      <button
        onClick={() => save.mutate()}
        disabled={!token.trim() || save.isPending}
        className="w-full rounded-xl bg-[#FFDD00] px-4 py-2.5 text-[13.5px] font-bold text-black hover:opacity-90 disabled:opacity-40"
      >
        {save.isPending ? 'Validando…' : 'Conectar Buy Me a Coffee'}
      </button>
    </div>
  )
}

const BMAC_CONFIG: PlatformConnectConfig = {
  platform: 'buymeacoffee',
  label: 'Buy Me a Coffee',
  color: '#FFDD00',
  logo: <BmacLogo />,
  tokenForm: BmacTokenForm,
  statusEndpoint: (id) => `/api/buymeacoffee/status?creatorId=${id}`,
  disconnectEndpoint: (id) => `/api/buymeacoffee/status?creatorId=${id}`,
  docsUrl: 'https://developers.buymeacoffee.com/dashboard',
  docsLabel: 'Obter token em developers.buymeacoffee.com',
}

export function BuyMeACoffeeConnect({ creatorId }: { creatorId: string }) {
  return <PlatformConnectCard creatorId={creatorId} config={BMAC_CONFIG} />
}

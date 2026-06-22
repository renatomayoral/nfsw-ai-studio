'use client'

import { useState } from 'react'
import type { OnboardingState } from './onboarding-wizard'

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? '@CreatorsLinkBot'

type Props = {
  state: OnboardingState
  updateState: (p: Partial<OnboardingState>) => void
  onNext: () => void
  onBack: () => void
}

type VerifyState = 'idle' | 'loading' | 'success' | 'error'

export function StepTelegram({ state, updateState, onNext, onBack }: Props) {
  const [channelUsername, setChannelUsername] = useState('')
  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const [channelTitle, setChannelTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleVerify() {
    if (!channelUsername.trim() || !state.creatorId) return
    setVerifyState('loading')
    setError(null)
    try {
      const res = await fetch('/api/telegram/verify-channel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ creatorId: state.creatorId, channelUsername: channelUsername.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao verificar o canal.')
        setVerifyState('error')
        return
      }
      setChannelTitle(data.channelTitle)
      setVerifyState('success')
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setVerifyState('error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Canal VIP no Telegram</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Conecte o canal privado da criadora. O {BOT_USERNAME} vai gerenciar acessos automaticamente — sem configuração técnica.
        </p>
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-[13.5px] font-semibold">Como conectar em 2 passos:</p>
        <ol className="flex flex-col gap-4">
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[10px] font-black text-blue-400">1</span>
            <div className="text-[13px] text-muted-foreground">
              <p>Crie um canal privado no Telegram com o nome e foto que quiser (ex: <span className="font-medium text-foreground">"VIP da Babi 🔥"</span>)</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-[10px] font-black text-blue-400">2</span>
            <div className="text-[13px] text-muted-foreground">
              <p>Adicione <code className="rounded bg-accent px-1.5 py-0.5 text-[12.5px] font-mono text-foreground">{BOT_USERNAME}</code> como <strong className="text-foreground">administrador</strong> do canal</p>
            </div>
          </li>
        </ol>

        <div className="mt-4 rounded-xl bg-blue-500/8 border border-blue-500/20 px-4 py-3 text-[12.5px] text-blue-400">
          O canal pode ter qualquer nome e foto — os fãs só veem o canal da criadora, não o bot.
        </div>
      </div>

      {/* Channel input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold">Username ou link do canal</label>
        <div className="flex gap-2">
          <input
            value={channelUsername}
            onChange={e => { setChannelUsername(e.target.value); setVerifyState('idle'); setError(null) }}
            placeholder="@babibarelli_vip ou t.me/babibarelli_vip"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500"
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={!channelUsername.trim() || verifyState === 'loading'}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
          >
            {verifyState === 'loading' && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            )}
            Verificar
          </button>
        </div>
        <span className="text-[12px] text-muted-foreground">
          O canal precisa ter um username público para que o bot consiga ser adicionado
        </span>
      </div>

      {/* Success state */}
      {verifyState === 'success' && channelTitle && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            ✓
          </div>
          <div>
            <p className="text-[13px] font-semibold text-emerald-400">Canal conectado!</p>
            <p className="text-[12px] text-muted-foreground">{channelTitle}</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Voltar
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={onNext} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            Pular por agora
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={verifyState !== 'success'}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  )
}

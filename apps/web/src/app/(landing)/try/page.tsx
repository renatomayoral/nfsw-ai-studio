'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, ImageIcon, AlertCircle, Zap, Lock } from 'lucide-react'

type QuotaStatus = {
  tier: string
  today: { imagesFast: number }
  limits: { imagesFastPerDay: number }
}

type GenerateResult = {
  jobId?: string
  error?: string
  upgradeUrl?: string
  watermark?: boolean
}

const STYLES = [
  { value: 'photorealistic', label: '📷 Fotorrealista' },
  { value: 'anime', label: '🎨 Anime' },
  { value: 'cinematic', label: '🎬 Cinemático' },
  { value: 'artistic', label: '🖌️ Artístico' },
]

const STYLE_SUFFIX: Record<string, string> = {
  photorealistic: ', photorealistic, 8k, ultra detailed, sharp focus',
  anime: ', anime style, vibrant colors, detailed illustration',
  cinematic: ', cinematic lighting, film grain, dramatic composition',
  artistic: ', digital painting, concept art, detailed brushwork',
}

export default function TryPage() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('photorealistic')
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quota, setQuota] = useState<QuotaStatus | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  // Load quota on mount
  useEffect(() => {
    fetch('/api/quota')
      .then((r) => r.json())
      .then((data: QuotaStatus) => {
        setQuota(data)
        if (data.today.imagesFast >= data.limits.imagesFastPerDay) {
          setLimitReached(true)
        }
      })
      .catch(() => null)
  }, [])

  async function handleGenerate() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setImageUrl(null)
    setJobId(null)

    const fullPrompt = prompt + STYLE_SUFFIX[style]

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'flux',
          prompt: fullPrompt,
          width: 512,
          height: 512,
          steps: 20,
        }),
      })

      const data = (await res.json()) as GenerateResult

      if (!res.ok) {
        if (res.status === 429) {
          setLimitReached(true)
          setError(data.error ?? 'Limite atingido.')
        } else {
          setError(data.error ?? 'Erro ao gerar imagem.')
        }
        return
      }

      if (data.jobId) {
        setJobId(data.jobId)
        pollStatus(data.jobId)
        // Update quota display optimistically
        setQuota((prev) =>
          prev
            ? { ...prev, today: { imagesFast: prev.today.imagesFast + 1 } }
            : prev,
        )
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function pollStatus(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate/${id}/status`)
        const data = (await res.json()) as { status: string; outputUrl?: string }

        if (data.status === 'completed' && data.outputUrl) {
          setImageUrl(data.outputUrl)
          clearInterval(interval)
        } else if (data.status === 'failed') {
          setError('A geração falhou. Tente novamente.')
          clearInterval(interval)
        }
      } catch {
        // keep polling
      }
    }, 2000)

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000)
  }

  const remaining = quota
    ? Math.max(0, quota.limits.imagesFastPerDay - quota.today.imagesFast)
    : null

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base font-bold">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              ✦
            </span>
            NFSW AI Studio
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Criar conta grátis
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300">
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            Experimente grátis — sem cadastro
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Gere imagens com{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #818cf8)' }}
            >
              FLUX.1
            </span>
          </h1>
          <p className="mt-3 text-zinc-400 max-w-lg mx-auto text-sm">
            Teste o gerador agora. Crie uma conta grátis para 20 imagens/dia + 1 vídeo de boas-vindas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — controls */}
          <div className="space-y-5">
            {/* Quota indicator */}
            {quota && (
              <div
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                  limitReached
                    ? 'border-red-500/30 bg-red-950/20 text-red-300'
                    : 'border-white/10 bg-white/3 text-zinc-400'
                }`}
              >
                <span>
                  {limitReached ? (
                    <>Limite de hoje atingido</>
                  ) : (
                    <>
                      <span className="text-white font-semibold">{remaining}</span> de{' '}
                      {quota.limits.imagesFastPerDay} gerações restantes hoje
                    </>
                  )}
                </span>
                {limitReached && (
                  <Link
                    href="/login"
                    className="ml-3 text-xs font-semibold text-violet-400 hover:text-violet-300"
                  >
                    Criar conta →
                  </Link>
                )}
              </div>
            )}

            {/* Prompt */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Descreva sua cena
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: beautiful woman on the beach at sunset, elegant dress..."
                disabled={limitReached}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50 resize-none"
              />
            </div>

            {/* Style */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Estilo</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    disabled={limitReached}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all text-left disabled:opacity-50 ${
                      style === s.value
                        ? 'border-violet-500 bg-violet-950/40 text-violet-300'
                        : 'border-white/10 bg-white/3 text-zinc-400 hover:border-white/20 hover:text-zinc-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading || limitReached}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Gerar Imagem
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p>{error}</p>
                  {limitReached && (
                    <Link
                      href="/login"
                      className="mt-1 inline-flex items-center gap-1 font-semibold text-violet-400 hover:text-violet-300"
                    >
                      Criar conta grátis para continuar
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Locked features teaser */}
            <div className="rounded-xl border border-white/5 bg-white/2 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Com conta grátis você desbloqueia
              </p>
              {[
                '20 imagens/dia (era 5)',
                '1 vídeo de boas-vindas (Wan 2.2)',
                'Histórico de 7 dias',
                'Resolução até 1024px',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                  <Lock className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                  {f}
                </div>
              ))}
              <Link
                href="/login"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-950/20 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-950/40 transition-colors"
              >
                Criar conta grátis
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Right — result */}
          <div className="flex flex-col">
            <div
              className="flex-1 min-h-72 rounded-2xl border border-white/10 bg-white/3 flex items-center justify-center overflow-hidden relative"
              style={{ aspectRatio: '1/1' }}
            >
              {loading && (
                <div className="flex flex-col items-center gap-3 text-zinc-500">
                  <div className="relative">
                    <div
                      className="h-12 w-12 rounded-full animate-spin"
                      style={{
                        border: '3px solid transparent',
                        borderTopColor: '#7c3aed',
                        borderRightColor: '#4f46e5',
                      }}
                    />
                  </div>
                  <p className="text-sm">Gerando com FLUX.1...</p>
                  <p className="text-xs text-zinc-600">~15–30 segundos</p>
                </div>
              )}

              {!loading && !imageUrl && (
                <div className="flex flex-col items-center gap-2 text-zinc-600">
                  <ImageIcon className="h-10 w-10" />
                  <p className="text-sm">Sua imagem aparecerá aqui</p>
                </div>
              )}

              {imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Imagem gerada"
                    className="w-full h-full object-cover"
                  />
                  {/* Watermark overlay */}
                  <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-zinc-400 backdrop-blur-sm">
                    NFSW AI Studio
                  </div>
                </>
              )}
            </div>

            {/* Post-generation CTA */}
            {imageUrl && (
              <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-950/20 p-4 text-center">
                <p className="text-sm font-semibold text-violet-300">Gostou?</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Crie uma conta grátis para salvar, aumentar resolução e gerar vídeos.
                </p>
                <Link
                  href="/login"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  Criar conta grátis
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer note */}
      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-xs text-zinc-600">
          🔞 Plataforma adulta · 18+ apenas · Conteúdo gerado por IA
        </p>
      </footer>
    </div>
  )
}

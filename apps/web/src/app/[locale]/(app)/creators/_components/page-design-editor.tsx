'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Palette, Check } from 'lucide-react'
import { PAGE_TEMPLATES, resolveConfig, type PageConfig } from '@/lib/page-templates'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'

type Props = { creatorId: string; slug: string }

type DesignState = { pageTemplate: string; pageConfig: Partial<PageConfig> | null }

const COLOR_FIELDS: { key: keyof PageConfig; label: string }[] = [
  { key: 'accentColor', label: 'Cor de destaque' },
  { key: 'bgFrom', label: 'Fundo (início)' },
  { key: 'bgTo', label: 'Fundo (fim)' },
  { key: 'textColor', label: 'Texto principal' },
  { key: 'mutedColor', label: 'Texto secundário' },
]

const FONT_OPTIONS = [
  { value: 'system-ui', label: 'System (padrão)' },
  { value: 'Georgia, serif', label: 'Georgia (serif)' },
  { value: "'Inter', system-ui", label: 'Inter' },
  { value: "'Playfair Display', Georgia, serif", label: 'Playfair (elegante)' },
]

const BUTTON_STYLES = [
  { value: 'pill', label: 'Pill' },
  { value: 'rounded', label: 'Arredondado' },
  { value: 'sharp', label: 'Reto' },
] as const

export function PageDesignEditor({ creatorId, slug }: Props) {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery<DesignState>({
    queryKey: ['page-design', creatorId],
    queryFn: () => fetch(`/api/creators/${creatorId}/page-design`).then((r) => r.json()),
  })

  const [localTemplate, setLocalTemplate] = useState<string | null>(null)
  const [localConfig, setLocalConfig] = useState<Partial<PageConfig> | null>(null)

  const activeTemplate = localTemplate ?? data?.pageTemplate ?? 'neon-dark'
  const activeOverrides = localConfig ?? data?.pageConfig ?? null
  const resolved = resolveConfig(activeTemplate, activeOverrides)

  const mutation = useMutation({
    mutationFn: (body: Partial<DesignState>) =>
      fetch(`/api/creators/${creatorId}/page-design`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['page-design', creatorId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleSave = useCallback(() => {
    mutation.mutate({
      pageTemplate: activeTemplate,
      pageConfig: activeOverrides ?? {},
    })
  }, [activeTemplate, activeOverrides, mutation])

  function patchConfig(patch: Partial<PageConfig>) {
    setLocalConfig((prev) => ({ ...(prev ?? {}), ...patch }))
  }

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted" />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Design da Página
          </CardTitle>
          <div className="flex items-center gap-2">
            <a
              href={`/p/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium hover:bg-accent"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver página
            </a>
            <button
              onClick={handleSave}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saved ? <><Check className="h-3.5 w-3.5" /> Salvo!</> : mutation.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Template grid */}
        <div>
          <p className="mb-2.5 text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
            Template
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PAGE_TEMPLATES.map((t) => {
              const cfg = resolveConfig(t.id)
              const isSelected = activeTemplate === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setLocalTemplate(t.id)
                    setLocalConfig(null) // reset overrides when switching template
                  }}
                  title={t.description}
                  className={[
                    'group relative flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40',
                  ].join(' ')}
                >
                  {/* mini preview */}
                  <div
                    className="h-14 w-full overflow-hidden rounded-lg"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${cfg.bgFrom}, ${cfg.bgTo})`,
                    }}
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-1">
                      <div
                        className="h-5 w-5 rounded-full border-2"
                        style={{ borderColor: cfg.accentColor, background: cfg.bgFrom }}
                      />
                      <div className="h-1 w-8 rounded-full" style={{ background: cfg.textColor, opacity: 0.7 }} />
                      <div className="h-1 w-5 rounded-full" style={{ background: cfg.mutedColor, opacity: 0.5 }} />
                      <div
                        className="mt-1 h-3 w-10 rounded"
                        style={{
                          background: cfg.accentColor,
                          opacity: 0.85,
                          borderRadius: cfg.buttonStyle === 'pill' ? 99 : cfg.buttonStyle === 'sharp' ? 2 : 6,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10.5px] font-semibold leading-tight">{t.name}</span>
                  {isSelected && (
                    <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                      ✓
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Color overrides */}
        <div>
          <p className="mb-2.5 text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
            Cores
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLOR_FIELDS.map(({ key, label }) => {
              const rawValue = (activeOverrides as Record<string, string> | null)?.[key] as string | undefined
              const displayValue = rawValue ?? (resolved[key] as string)
              // only show color picker for solid hex colors
              const isHex = /^#[0-9a-fA-F]{3,8}$/.test(displayValue)
              return (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[11.5px] font-medium text-muted-foreground">{label}</label>
                  <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5">
                    {isHex ? (
                      <input
                        type="color"
                        value={displayValue}
                        onChange={(e) => patchConfig({ [key]: e.target.value } as Partial<PageConfig>)}
                        className="h-5 w-5 cursor-pointer rounded border-none bg-transparent p-0"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded border" style={{ background: displayValue }} />
                    )}
                    <input
                      type="text"
                      value={rawValue ?? ''}
                      placeholder={displayValue}
                      onChange={(e) => patchConfig({ [key]: e.target.value } as Partial<PageConfig>)}
                      className="flex-1 bg-transparent text-[12px] font-mono outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Font + button style */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11.5px] font-medium text-muted-foreground">Fonte</label>
            <select
              value={(activeOverrides as Partial<PageConfig> | null)?.fontFamily ?? resolved.fontFamily}
              onChange={(e) => patchConfig({ fontFamily: e.target.value })}
              className="rounded-lg border bg-background px-2 py-1.5 text-[12.5px] outline-none"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11.5px] font-medium text-muted-foreground">Botões</label>
            <div className="flex gap-1.5">
              {BUTTON_STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => patchConfig({ buttonStyle: s.value })}
                  className={[
                    'flex-1 rounded-lg border py-1.5 text-[11.5px] font-medium transition-colors',
                    resolved.buttonStyle === s.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-accent',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Glow intensity */}
        <div className="flex flex-col gap-1">
          <label className="text-[11.5px] font-medium text-muted-foreground">
            Intensidade do glow — {Math.round(resolved.glowOpacity * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={(activeOverrides as Partial<PageConfig> | null)?.glowOpacity ?? resolved.glowOpacity}
            onChange={(e) => patchConfig({ glowOpacity: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      </CardContent>
    </Card>
  )
}

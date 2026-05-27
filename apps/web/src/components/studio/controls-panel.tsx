'use client'

import { useId, useRef, useCallback } from 'react'
import { Label } from '@repo/ui/components/label'
import { Textarea } from '@repo/ui/components/textarea'
import { Slider } from '@repo/ui/components/slider'
import { Button } from '@repo/ui/components/button'
import { ChevronDown, Shuffle, Upload, X } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { IMAGE_PRESETS, VIDEO_PRESETS, FRAME_PRESETS } from './studio-types'
import { useStudio } from './studio-context'

// ── Slider field ──────────────────────────────────────────────────────────────

function SliderField({
  label, hint, min, max, step, value, onChange,
}: {
  label:    string
  hint?:    string
  min:      number
  max:      number
  step:     number
  value:    number
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm tabular-nums">{label}</Label>
        {hint && <span className="text-[10px] text-neutral-500">{hint}</span>}
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? min)}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    </div>
  )
}

// ── Image upload zone ─────────────────────────────────────────────────────────

function ImageUploadZone() {
  const { state: { values }, actions: { } } = useStudio()
  const { state, actions } = useStudio()
  const { form } = state
  const inputRef = useRef<HTMLInputElement>(null)

  const imageBase64 = values.imageBase64

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // Strip the data:image/...;base64, prefix — ComfyUI expects raw base64
      const base64 = result.split(',')[1] ?? ''
      form.setValue('imageBase64', base64)
    }
    reader.readAsDataURL(file)
  }, [form])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) loadFile(file)
  }, [loadFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }, [loadFile])

  const clear = useCallback(() => {
    form.setValue('imageBase64', '')
    if (inputRef.current) inputRef.current.value = ''
  }, [form])

  if (imageBase64) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-neutral-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="Imagem de entrada"
          className="w-full max-h-48 object-contain"
        />
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={clear}
          aria-label="Remover imagem"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Clique ou arraste uma imagem aqui"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/10',
        'bg-neutral-950 py-8 text-center cursor-pointer transition-colors',
        'hover:border-violet-500/50 hover:bg-violet-500/5',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500',
      )}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Upload className="h-6 w-6 text-neutral-500" aria-hidden="true" />
      <div>
        <p className="text-sm text-neutral-400">Clique ou arraste uma imagem</p>
        <p className="text-xs text-neutral-600 mt-0.5">PNG, JPG, WEBP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleChange}
        aria-hidden="true"
      />
    </div>
  )
}

// ── Controls panel ────────────────────────────────────────────────────────────

/**
 * Renders all form controls for the active model tab.
 * Reads form state and actions from StudioContext — no props needed.
 */
export function ControlsPanel() {
  const { state: { form, isVideo, isI2I, advancedOpen, values }, actions: { setAdvancedOpen } } = useStudio()
  const { register, setValue, formState: { errors } } = form

  const promptId    = useId()
  const negPromptId = useId()
  const seedId      = useId()

  const presets      = isVideo ? VIDEO_PRESETS : IMAGE_PRESETS
  const activePreset = presets.find((p) => p.w === values.width && p.h === values.height)

  return (
    <div className="space-y-4">

      {/* Image upload (i2i tabs only) */}
      {isI2I && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Imagem de entrada</Label>
          <ImageUploadZone />
          {isI2I && !values.imageBase64 && (
            <p className="text-xs text-amber-400">⚠ Faça upload de uma imagem para gerar</p>
          )}
        </div>
      )}

      {/* Prompt */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={promptId} className="text-sm font-medium">Prompt</Label>
          <span className="text-[11px] text-neutral-500 tabular-nums">
            {values.prompt?.length ?? 0}/2000
          </span>
        </div>
        <Textarea
          id={promptId}
          placeholder={isI2I ? 'Descreva as alterações desejadas…' : 'Descreva o que deseja gerar…'}
          rows={4}
          autoFocus
          className="resize-none text-sm"
          autoComplete="off"
          {...register('prompt')}
        />
        {errors.prompt && (
          <p className="text-xs text-destructive" role="alert">{errors.prompt.message}</p>
        )}
      </div>

      {/* Negative prompt (not shown for flux/flux-i2i since FLUX ignores it) */}
      {isVideo && (
        <details className="group">
          <summary className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer list-none select-none transition-colors">
            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" aria-hidden="true" />
            Prompt Negativo
          </summary>
          <div className="mt-2">
            <Textarea
              id={negPromptId}
              placeholder="O que evitar na geração…"
              rows={2}
              className="resize-none text-sm"
              autoComplete="off"
              {...register('negativePrompt')}
            />
          </div>
        </details>
      )}

      {/* Resolution presets */}
      <div className="space-y-2">
        <Label className="text-xs text-neutral-400 uppercase tracking-wide">Resolução</Label>
        <div className={cn('grid gap-1.5', isVideo ? 'grid-cols-3' : 'grid-cols-4')}>
          {presets.map((p) => {
            const isActive = activePreset?.w === p.w && activePreset?.h === p.h
            return (
              <button
                key={`${p.w}x${p.h}`}
                type="button"
                onClick={() => { setValue('width', p.w); setValue('height', p.h) }}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-[11px] font-medium transition-all',
                  isActive
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-white/8 bg-white/3 text-neutral-400 hover:border-white/20 hover:text-neutral-200',
                )}
                aria-pressed={isActive}
              >
                <span className="text-base leading-none">{p.icon}</span>
                <span>{p.label}</span>
                <span className="text-[9px] opacity-60">{p.w}×{p.h}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Frame duration presets (video only) */}
      {isVideo && (
        <div className="space-y-2">
          <Label className="text-xs text-neutral-400 uppercase tracking-wide">Duração</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {FRAME_PRESETS.map((fp) => {
              const isActive = values.frames === fp.frames
              return (
                <button
                  key={fp.frames}
                  type="button"
                  onClick={() => setValue('frames', fp.frames)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                    isActive
                      ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                      : 'border-white/8 bg-white/3 text-neutral-400 hover:border-white/20 hover:text-neutral-200',
                  )}
                  aria-pressed={isActive}
                >
                  {fp.label}
                  <span className="block text-[9px] opacity-60 mt-0.5">{fp.frames} frames</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Denoise strength (i2i tabs only) */}
      {isI2I && (
        <SliderField
          label={`Intensidade: ${((values.denoise ?? 0.75) * 100).toFixed(0)}%`}
          hint="Mais alto = mais criativo, menos alto = mais fiel à original"
          min={0.1} max={1.0} step={0.05}
          value={values.denoise ?? 0.75}
          onChange={(v) => setValue('denoise', v)}
        />
      )}

      {/* Advanced settings */}
      <details
        open={advancedOpen}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer list-none select-none transition-colors">
          <ChevronDown className="h-3 w-3 transition-transform open:rotate-180" aria-hidden="true" />
          Configurações avançadas
        </summary>

        <div className="mt-3 space-y-4 pl-1">
          <SliderField
            label={`Steps: ${values.steps}`}
            hint="Mais steps = mais qualidade, mais lento"
            min={1} max={60} step={1}
            value={values.steps}
            onChange={(v) => setValue('steps', v)}
          />
          <SliderField
            label={`CFG: ${values.cfg}`}
            hint="Aderência ao prompt (3–7 para FLUX, 5–8 para Wan)"
            min={1} max={20} step={0.5}
            value={values.cfg}
            onChange={(v) => setValue('cfg', v)}
          />

          {/* Seed */}
          <div className="space-y-1.5">
            <Label htmlFor={seedId} className="text-sm">Seed</Label>
            <div className="flex items-center gap-2">
              <input
                id={seedId}
                type="number"
                min={0}
                autoComplete="off"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono tabular-nums focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                {...register('seed', { valueAsNumber: true, min: 0 })}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 shrink-0"
                onClick={() => setValue('seed', Math.floor(Math.random() * 2 ** 32))}
                aria-label="Gerar seed aleatória"
              >
                <Shuffle className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}

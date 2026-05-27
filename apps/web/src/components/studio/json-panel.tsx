'use client'

import { RefreshCw, AlertCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@repo/ui/components/button'
import { useStudio } from './studio-context'

/**
 * Editable JSON view of the ComfyUI workflow.
 * Reads rawJson / jsonError from StudioContext and lets the user
 * tweak nodes before submitting.
 */
export function JsonPanel() {
  const {
    state:   { rawJson, jsonError, modelTab },
    actions: { setRawJson, refreshJson },
  } = useStudio()

  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(rawJson).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-400">
            Workflow ComfyUI
          </span>
          <span className="text-[10px] font-mono bg-white/6 text-neutral-500 px-1.5 py-0.5 rounded">
            {modelTab}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-neutral-500 hover:text-neutral-200"
            onClick={handleCopy}
            aria-label="Copiar JSON"
            title="Copiar JSON"
          >
            {copied
              ? <Check   className="h-3.5 w-3.5 text-green-400" aria-hidden="true" />
              : <Copy    className="h-3.5 w-3.5"                 aria-hidden="true" />
            }
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-neutral-500 hover:text-neutral-200"
            onClick={refreshJson}
            aria-label="Recomputar workflow a partir dos valores atuais"
            title="Recomputar da configuração atual"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Error badge */}
      {jsonError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400"
        >
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span className="font-mono break-all">{jsonError}</span>
        </div>
      )}

      {/* Editable JSON textarea */}
      <textarea
        value={rawJson}
        onChange={(e) => setRawJson(e.target.value)}
        spellCheck={false}
        className="w-full min-h-[420px] resize-y rounded-lg border border-white/8 bg-neutral-950 px-3 py-3 font-mono text-[11px] leading-relaxed text-neutral-300 placeholder-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
        aria-label="Workflow JSON editável"
        aria-invalid={jsonError !== null}
        aria-describedby={jsonError ? 'json-error' : undefined}
      />

      <p className="text-[10px] text-neutral-600">
        Edite os nós diretamente. Use{' '}
        <RefreshCw className="inline h-2.5 w-2.5" aria-hidden="true" />{' '}
        para recomputar a partir da configuração atual.
      </p>
    </div>
  )
}

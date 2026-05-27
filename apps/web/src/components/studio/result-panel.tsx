'use client'

import { ImageIcon, VideoIcon, Download } from 'lucide-react'
import { Progress } from '@repo/ui/components/progress'
import { useStudio } from './studio-context'

/**
 * Preview area: shows empty state, generating overlay, or the final result.
 * Reads state from StudioContext — no props needed.
 */
export function ResultPanel() {
  const { state: { resultUrl, resultType, isGenerating, genProgress, isVideo, values } } = useStudio()
  const { width, height } = values
  const aspectRatio = `${width} / ${height}`

  return (
    <div
      className="relative flex-1 min-h-90 rounded-xl bg-neutral-900 border border-white/8 overflow-hidden flex items-center justify-center"
      style={{ aspectRatio }}
    >
      {/* Generating overlay */}
      {isGenerating && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-950/80 backdrop-blur-sm z-10"
          aria-live="polite"
          aria-label={`Gerando, ${genProgress}% concluído`}
        >
          <div className="w-48 space-y-2">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Gerando…</span>
              <span aria-hidden="true">{genProgress}%</span>
            </div>
            <Progress value={genProgress} className="h-1" />
          </div>
          <p className="text-xs text-neutral-500">
            {genProgress < 10 ? 'Carregando modelos…' :
             genProgress < 90 ? 'Processando…' :
             'Finalizando…'}
          </p>
        </div>
      )}

      {/* Result */}
      {resultUrl && !isGenerating ? (
        <div className="relative w-full h-full group">
          {resultType === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resultUrl}
              alt="Imagem gerada"
              className="w-full h-full object-contain"
              width={width}
              height={height}
            />
          ) : (
            <video
              src={resultUrl}
              controls
              autoPlay
              loop
              className="w-full h-full object-contain"
            />
          )}
          {/* Download overlay */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => window.open(resultUrl, '_blank')}
              className="flex items-center gap-1.5 rounded-lg bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white hover:bg-black/90 transition-colors"
              aria-label="Download do resultado"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download
            </button>
          </div>
        </div>
      ) : !isGenerating ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-3 text-neutral-600 select-none pointer-events-none">
          {isVideo ? (
            <VideoIcon className="h-12 w-12" aria-hidden="true" />
          ) : (
            <ImageIcon className="h-12 w-12" aria-hidden="true" />
          )}
          <p className="text-sm">O resultado aparece aqui</p>
        </div>
      ) : null}

      {/* Aspect ratio badge */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="text-[10px] font-mono text-neutral-600 bg-neutral-900/80 px-1.5 py-0.5 rounded">
          {width}×{height}
        </span>
      </div>
    </div>
  )
}

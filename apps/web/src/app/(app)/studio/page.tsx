'use client'

import { useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { Button } from '@repo/ui/components/button'
import { ImageIcon, VideoIcon, Sparkles, Wand2, Loader2, Braces } from 'lucide-react'
import { StudioProvider, useStudio } from '@/components/studio/studio-context'
import { VmBanner }      from '@/components/studio/vm-banner'
import { ResultPanel }   from '@/components/studio/result-panel'
import { ControlsPanel } from '@/components/studio/controls-panel'
import { JsonPanel }     from '@/components/studio/json-panel'

// ── Inner layout (needs context) ──────────────────────────────────────────────

function StudioLayout() {
  const {
    state:   { activeTab, isGenerating, genProgress, vmReady, form, jsonError },
    actions: { setActiveTab, submit },
  } = useStudio()

  // Cmd/Ctrl+Enter to generate from anywhere on the page
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }, [submit])

  const isJsonTab    = activeTab === 'json'
  const jsonInvalid  = isJsonTab && jsonError !== null

  return (
    <div className="flex flex-col gap-4 h-full" onKeyDown={handleKeyDown}>

      {/* VM status banner — hidden when ready */}
      <VmBanner />

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 flex-1 min-h-0">

        {/* Left: preview */}
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Studio</h1>
          <ResultPanel />
        </div>

        {/* Right: controls */}
        <div className="flex flex-col gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="flux" className="gap-1.5 text-xs">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Imagem
              </TabsTrigger>
              <TabsTrigger value="wan-t2v" className="gap-1.5 text-xs">
                <VideoIcon className="h-3.5 w-3.5" aria-hidden="true" />
                T2V
              </TabsTrigger>
              <TabsTrigger value="wan-i2v" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                I2V
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-1.5 text-xs">
                <Braces className="h-3.5 w-3.5" aria-hidden="true" />
                JSON
              </TabsTrigger>
            </TabsList>

            <form
              onSubmit={form.handleSubmit(() => submit())}
              className="space-y-4 mt-4"
            >
              {/* Model tabs share the same ControlsPanel — context supplies isVideo */}
              <TabsContent value="flux"    className="mt-0"><ControlsPanel /></TabsContent>
              <TabsContent value="wan-t2v" className="mt-0"><ControlsPanel /></TabsContent>
              <TabsContent value="wan-i2v" className="mt-0"><ControlsPanel /></TabsContent>

              {/* JSON editor tab */}
              <TabsContent value="json" className="mt-0"><JsonPanel /></TabsContent>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isGenerating || !vmReady || jsonInvalid}
                aria-label={isGenerating ? `Gerando, ${genProgress}% concluído` : 'Gerar'}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Gerando… {genProgress}%
                  </>
                ) : !vmReady ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Aguardando GPU…
                  </>
                ) : jsonInvalid ? (
                  <>
                    <Braces className="h-4 w-4 mr-2" aria-hidden="true" />
                    JSON inválido
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Gerar
                    <kbd className="ml-auto text-[10px] opacity-40 font-mono hidden sm:inline">⌘↵</kbd>
                  </>
                )}
              </Button>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// ── Page (wraps with provider) ────────────────────────────────────────────────

export default function StudioPage() {
  return (
    <StudioProvider>
      <StudioLayout />
    </StudioProvider>
  )
}

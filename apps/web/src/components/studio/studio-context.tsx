'use client'

import { createContext, use, useCallback, useEffect, useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@repo/ui/hooks/use-toast'
import { useVmStore } from '@/lib/vm-store'
import { createFLUXWorkflow, createWanT2VWorkflow, createWanI2VWorkflow } from '@repo/comfyui-client/workflows'
import { generateSchema, type GenerateForm, type JobStatus } from './studio-types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a formatted workflow JSON string from current form values */
function buildWorkflowJson(modelTab: string, values: GenerateForm): string {
  try {
    let wf
    if (modelTab === 'flux') {
      wf = createFLUXWorkflow(values)
    } else if (modelTab === 'wan-t2v') {
      wf = createWanT2VWorkflow({ ...values, frames: values.frames ?? 49 })
    } else {
      wf = createWanI2VWorkflow({ ...values, frames: values.frames ?? 49, imageBase64: '' })
    }
    return JSON.stringify(wf, null, 2)
  } catch {
    return '{}'
  }
}

// ── Context interface ─────────────────────────────────────────────────────────

type StudioState = {
  activeTab:    string
  modelTab:     string   // last non-json tab — determines workflow model
  isVideo:      boolean
  isGenerating: boolean
  genProgress:  number
  resultUrl:    string | null
  resultType:   'image' | 'video'
  advancedOpen: boolean
  vmReady:      boolean
  form:         UseFormReturn<GenerateForm>
  values:       GenerateForm
  rawJson:      string
  jsonError:    string | null
}

type StudioActions = {
  setActiveTab:    (tab: string) => void
  submit:          () => void
  setAdvancedOpen: (v: boolean) => void
  setRawJson:      (json: string) => void
  refreshJson:     () => void
}

type StudioContextValue = {
  state:   StudioState
  actions: StudioActions
}

// ── Context ───────────────────────────────────────────────────────────────────

const StudioContext = createContext<StudioContextValue | null>(null)

export function useStudio(): StudioContextValue {
  const ctx = use(StudioContext)
  if (!ctx) throw new Error('useStudio must be used within <StudioProvider>')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const { phase, boot } = useVmStore()
  const router          = useRouter()
  const searchParams    = useSearchParams()
  const { toast }       = useToast()

  // Boot VM once on mount (idempotent — store guards duplicate calls)
  useEffect(() => {
    if (phase === 'idle' || phase === 'offline' || phase === 'error') void boot()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tab state via URL so links/back-button work
  const activeTab = searchParams.get('tab') ?? 'flux'
  const isVideo   = activeTab === 'wan-t2v' || activeTab === 'wan-i2v'

  // modelTab: the last model tab that was active (never 'json')
  // Used to know which model's workflow to compute/submit in JSON mode
  const [modelTab, setModelTab] = useState<string>('flux')

  // JSON editor state
  const [rawJson,    setRawJson]    = useState<string>('')
  const [jsonError,  setJsonError]  = useState<string | null>(null)

  // Generation state
  const [genProgress,  setGenProgress]  = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultUrl,    setResultUrl]    = useState<string | null>(null)
  const [resultType,   setResultType]   = useState<'image' | 'video'>('image')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Form — Provider is the sole owner; children read via context
  const form = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      prompt:         '',
      negativePrompt: '',
      width:          832,
      height:         1216,
      steps:          20,
      cfg:            3.5,
      seed:           Math.floor(Math.random() * 2 ** 32),
      frames:         49,
    },
  })

  const values  = form.watch()
  const vmReady = phase === 'ready'

  // When switching tabs: update modelTab and reset resolution defaults
  useEffect(() => {
    if (activeTab === 'json') return  // JSON tab doesn't affect model or resolution

    setModelTab(activeTab)

    if (activeTab === 'flux') {
      form.setValue('width',  832)
      form.setValue('height', 1216)
    } else {
      form.setValue('width',  832)
      form.setValue('height', 480)
      form.setValue('frames', 49)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // When switching to JSON tab, compute the workflow from current form state
  useEffect(() => {
    if (activeTab !== 'json') return
    setRawJson(buildWorkflowJson(modelTab, values))
    setJsonError(null)
  // Intentionally NOT watching `values` — we snapshot on tab switch, not on every keystroke
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Update rawJson parse error on every change
  const handleSetRawJson = useCallback((json: string) => {
    setRawJson(json)
    try {
      JSON.parse(json)
      setJsonError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'JSON inválido')
    }
  }, [])

  // Recompute workflow JSON from current form values (snapshot now)
  const refreshJson = useCallback(() => {
    const json = buildWorkflowJson(modelTab, form.getValues())
    setRawJson(json)
    setJsonError(null)
  }, [modelTab, form])

  const setActiveTab = useCallback(
    (tab: string) => router.replace(`/studio?tab=${tab}`, { scroll: false }),
    [router],
  )

  const { mutate: generate } = useMutation({
    mutationFn: async (data: GenerateForm) => {
      // In JSON mode: send the raw (possibly edited) workflow directly
      let body: Record<string, unknown> = { ...data, model: modelTab }

      if (activeTab === 'json') {
        let parsed: unknown
        try {
          parsed = JSON.parse(rawJson)
        } catch (e) {
          throw new Error(`JSON inválido: ${e instanceof Error ? e.message : String(e)}`)
        }
        body = { ...data, model: modelTab, rawWorkflow: parsed }
      }

      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Falha ao submeter job')
      }
      return (await res.json()) as { jobId: string }
    },
    onMutate: () => {
      setIsGenerating(true)
      setGenProgress(0)
      setResultUrl(null)
    },
    onSuccess: ({ jobId }) => {
      const es = new EventSource(`/api/generate/${jobId}/status`)
      es.onmessage = (e) => {
        const data = JSON.parse(e.data as string) as JobStatus
        if (data.percentage !== undefined) setGenProgress(data.percentage)
        if (data.status === 'completed' && data.outputUrl) {
          es.close()
          setGenProgress(100)
          setResultUrl(data.outputUrl)
          setResultType(data.outputType ?? 'image')
          setIsGenerating(false)
          toast({ title: 'Geração concluída! 🎉' })
        }
        if (data.status === 'failed') {
          es.close()
          setIsGenerating(false)
          toast({ title: 'Falha na geração', description: 'Verifique os logs da VM.', variant: 'destructive' })
        }
      }
      es.onerror = () => { es.close(); setIsGenerating(false) }
    },
    onError: (err) => {
      setIsGenerating(false)
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    },
  })

  // submit: in JSON mode bypass form validation; in model mode run it
  const submit = useCallback(() => {
    if (activeTab === 'json') {
      // Don't validate form fields — raw workflow is what gets sent
      generate(form.getValues())
    } else {
      form.handleSubmit((d) => generate(d))()
    }
  }, [activeTab, form, generate])

  return (
    <StudioContext value={{
      state: {
        activeTab,
        modelTab,
        isVideo,
        isGenerating,
        genProgress,
        resultUrl,
        resultType,
        advancedOpen,
        vmReady,
        form,
        values,
        rawJson,
        jsonError,
      },
      actions: {
        setActiveTab,
        submit,
        setAdvancedOpen,
        setRawJson: handleSetRawJson,
        refreshJson,
      },
    }}>
      {children}
    </StudioContext>
  )
}

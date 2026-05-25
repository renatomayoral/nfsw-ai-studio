'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Textarea } from '@repo/ui/components/textarea'
import { Label } from '@repo/ui/components/label'
import { Slider } from '@repo/ui/components/slider'
import { Progress } from '@repo/ui/components/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog'
import { Badge } from '@repo/ui/components/badge'
import { useToast } from '@repo/ui/hooks/use-toast'
import { Wand2, Loader2 } from 'lucide-react'

const generateSchema = z.object({
  prompt: z.string().min(3, 'Prompt deve ter ao menos 3 caracteres'),
  negativePrompt: z.string().optional(),
  width: z.number().min(256).max(2048),
  height: z.number().min(256).max(2048),
  steps: z.number().min(1).max(100),
  cfg: z.number().min(1).max(30),
  seed: z.number(),
  frames: z.number().min(16).max(200).optional(),
})

type GenerateForm = z.infer<typeof generateSchema>

type GenerateResponse = {
  jobId: string
}

type JobStatus = {
  status: 'pending' | 'running' | 'completed' | 'failed'
  percentage?: number
  outputUrl?: string
  outputType?: 'image' | 'video'
}

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState('flux')
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image')
  const { toast } = useToast()

  const form = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      prompt: '',
      negativePrompt: '',
      width: 1024,
      height: 1024,
      steps: 20,
      cfg: 3.5,
      seed: Math.floor(Math.random() * 2 ** 32),
      frames: 81,
    },
  })

  const { mutate: generate, isPending } = useMutation({
    mutationFn: async (data: GenerateForm) => {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, model: activeTab }),
      })
      if (!res.ok) throw new Error('Falha ao submeter job')
      return (await res.json()) as GenerateResponse
    },
    onSuccess: ({ jobId }) => {
      setProgress(0)
      pollStatus(jobId)
    },
    onError: (err) => {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const pollStatus = (jobId: string) => {
    const es = new EventSource(`/api/generate/${jobId}/status`)

    es.onmessage = (e) => {
      const data = JSON.parse(e.data as string) as JobStatus

      if (data.percentage !== undefined) {
        setProgress(data.percentage)
      }

      if (data.status === 'completed' && data.outputUrl) {
        es.close()
        setProgress(100)
        setPreviewUrl(data.outputUrl)
        setPreviewType(data.outputType ?? 'image')
        toast({ title: 'Geração concluída!' })
      }

      if (data.status === 'failed') {
        es.close()
        toast({
          title: 'Falha na geração',
          variant: 'destructive',
        })
      }
    }

    es.onerror = () => es.close()
  }

  const values = form.watch()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Gerar</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flux">🖼 Imagem (FLUX)</TabsTrigger>
          <TabsTrigger value="wan-t2v">🎬 Vídeo T2V</TabsTrigger>
          <TabsTrigger value="wan-i2v">✨ Animar (I2V)</TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit((d) => generate(d))}>
          <TabsContent value="flux" className="space-y-4 mt-4">
            <GenerateForm form={form} showFrames={false} />
          </TabsContent>
          <TabsContent value="wan-t2v" className="space-y-4 mt-4">
            <GenerateForm form={form} showFrames />
          </TabsContent>
          <TabsContent value="wan-i2v" className="space-y-4 mt-4">
            <GenerateForm form={form} showFrames />
          </TabsContent>

          {isPending && (
            <Card className="mt-4">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gerando...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={isPending}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando... {progress}%
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Gerar
              </>
            )}
          </Button>
        </form>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewUrl}
        onOpenChange={(o) => !o && setPreviewUrl(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resultado</DialogTitle>
          </DialogHeader>
          {previewType === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl ?? ''}
              alt="Generated"
              className="w-full rounded-lg"
            />
          ) : (
            <video
              src={previewUrl ?? ''}
              controls
              autoPlay
              loop
              className="w-full rounded-lg"
            />
          )}
          <div className="flex gap-2 justify-end">
            <Badge variant="secondary">{values.width}×{values.height}</Badge>
            <Badge variant="secondary">{values.steps} steps</Badge>
            <Button
              size="sm"
              onClick={() => window.open(previewUrl ?? '', '_blank')}
            >
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GenerateForm({
  form,
  showFrames,
}: {
  form: ReturnType<typeof useForm<GenerateForm>>
  showFrames: boolean
}) {
  const { register, watch, setValue, formState: { errors } } = form
  const values = watch()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Parâmetros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Descreva o que deseja gerar..."
            rows={3}
            {...register('prompt')}
          />
          {errors.prompt && (
            <p className="text-xs text-destructive">{errors.prompt.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="negativePrompt">Prompt Negativo</Label>
          <Textarea
            id="negativePrompt"
            placeholder="O que evitar na geração..."
            rows={2}
            {...register('negativePrompt')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SliderField
            label={`Largura: ${values.width}px`}
            min={256}
            max={2048}
            step={64}
            value={values.width}
            onChange={(v) => setValue('width', v)}
          />
          <SliderField
            label={`Altura: ${values.height}px`}
            min={256}
            max={2048}
            step={64}
            value={values.height}
            onChange={(v) => setValue('height', v)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SliderField
            label={`Steps: ${values.steps}`}
            min={1}
            max={60}
            step={1}
            value={values.steps}
            onChange={(v) => setValue('steps', v)}
          />
          <SliderField
            label={`CFG: ${values.cfg}`}
            min={1}
            max={20}
            step={0.5}
            value={values.cfg}
            onChange={(v) => setValue('cfg', v)}
          />
        </div>

        {showFrames && (
          <SliderField
            label={`Frames: ${values.frames ?? 81}`}
            min={16}
            max={200}
            step={8}
            value={values.frames ?? 81}
            onChange={(v) => setValue('frames', v)}
          />
        )}

        <div className="flex items-center gap-3">
          <Label className="text-sm">Seed:</Label>
          <input
            type="number"
            className="flex h-9 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm"
            {...register('seed', { valueAsNumber: true })}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setValue('seed', Math.floor(Math.random() * 2 ** 32))
            }
          >
            🎲 Random
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v ?? min)}
      />
    </div>
  )
}

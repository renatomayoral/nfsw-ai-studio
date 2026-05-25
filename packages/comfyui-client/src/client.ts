import WebSocket from 'ws'
import type {
  ComfyWorkflow,
  JobStatus,
  JobOutput,
  ProgressUpdate,
  ModelList,
  OutputFile,
} from '@repo/shared/types'
import { COMFYUI_DEFAULTS } from '@repo/shared/constants'

type ProgressCallback = (update: ProgressUpdate) => void

type ComfyPromptResponse = { prompt_id: string; number: number }
type ComfyHistoryEntry = {
  status: { status_str: string; completed: boolean }
  outputs: Record<
    string,
    { images?: OutputFile[]; gifs?: OutputFile[] }
  >
}

export class ComfyUIClient {
  private baseUrl: string
  private clientId: string

  constructor(baseUrl: string = COMFYUI_DEFAULTS.baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.clientId = crypto.randomUUID()
  }

  async submitWorkflow(workflow: ComfyWorkflow): Promise<string> {
    const res = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow, client_id: this.clientId }),
    })

    if (!res.ok) {
      throw new Error(`ComfyUI submit failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as ComfyPromptResponse
    return data.prompt_id
  }

  async getJobStatus(promptId: string): Promise<JobStatus> {
    const res = await fetch(`${this.baseUrl}/history/${promptId}`)
    if (!res.ok) return 'pending'

    const history = (await res.json()) as Record<string, ComfyHistoryEntry>
    const entry = history[promptId]
    if (!entry) return 'pending'

    if (entry.status.completed) return 'completed'
    if (entry.status.status_str === 'error') return 'failed'
    return 'running'
  }

  async getJobOutput(promptId: string): Promise<JobOutput> {
    const res = await fetch(`${this.baseUrl}/history/${promptId}`)
    if (!res.ok) {
      return { promptId, status: 'failed', error: `HTTP ${res.status}` }
    }

    const history = (await res.json()) as Record<string, ComfyHistoryEntry>
    const entry = history[promptId]
    if (!entry) return { promptId, status: 'pending' }

    const images: OutputFile[] = []
    const videos: OutputFile[] = []

    for (const node of Object.values(entry.outputs)) {
      if (node.images) {
        images.push(...node.images.map((f) => f as OutputFile))
      }
      if (node.gifs) {
        videos.push(...node.gifs.map((f) => f as OutputFile))
      }
    }

    const status = entry.status.completed
      ? 'completed'
      : entry.status.status_str === 'error'
        ? 'failed'
        : 'running'

    return { promptId, status, images, videos }
  }

  subscribeToProgress(
    promptId: string,
    onProgress: ProgressCallback,
  ): () => void {
    const wsUrl = `${this.baseUrl.replace('http', 'ws')}${COMFYUI_DEFAULTS.wsPath}?clientId=${this.clientId}`
    const ws = new WebSocket(wsUrl)

    let totalSteps = 0

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string
          data: Record<string, unknown>
        }

        if (msg.type === 'progress') {
          const value = msg.data['value'] as number
          const max = msg.data['max'] as number
          totalSteps = max
          onProgress({
            promptId,
            step: value,
            totalSteps: max,
            percentage: Math.round((value / max) * 100),
          })
        }

        if (msg.type === 'executing' && msg.data['node'] == null) {
          // Execution complete
          onProgress({
            promptId,
            step: totalSteps,
            totalSteps,
            percentage: 100,
          })
          ws.close()
        }
      } catch {
        // ignore parse errors
      }
    })

    return () => ws.close()
  }

  async getInstalledModels(): Promise<ModelList> {
    const res = await fetch(`${this.baseUrl}/object_info`)
    if (!res.ok) throw new Error(`ComfyUI object_info failed: ${res.status}`)

    const info = (await res.json()) as Record<
      string,
      { input?: { required?: Record<string, unknown[]> } }
    >

    const ckptLoader = info['CheckpointLoaderSimple']
    const checkpoints =
      (ckptLoader?.input?.required?.['ckpt_name']?.[0] as string[]) ?? []

    const unetLoader = info['UNETLoader']
    const unet =
      (unetLoader?.input?.required?.['unet_name']?.[0] as string[]) ?? []

    const vaeLoader = info['VAELoader']
    const vae =
      (vaeLoader?.input?.required?.['vae_name']?.[0] as string[]) ?? []

    const clipLoader = info['CLIPLoader']
    const textEncoders =
      (clipLoader?.input?.required?.['clip_name']?.[0] as string[]) ?? []

    const loraLoader = info['LoraLoader']
    const loras =
      (loraLoader?.input?.required?.['lora_name']?.[0] as string[]) ?? []

    return { checkpoints, unet, vae, textEncoders, loras }
  }

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/system_stats`, {
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch {
      return false
    }
  }
}

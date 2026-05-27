export type ComfyWorkflow = Record<string, ComfyNode>

export type ComfyNode = {
  class_type: string
  inputs: Record<string, unknown>
}

export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type JobOutput = {
  promptId: string
  status: JobStatus
  images?: OutputFile[]
  videos?: OutputFile[]
  error?: string
}

export type OutputFile = {
  filename: string
  subfolder: string
  type: string
}

export type ProgressUpdate = {
  promptId: string
  step: number
  totalSteps: number
  node?: string
  percentage: number
}

export type FLUXParams = {
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  steps: number
  cfg: number
  seed: number
}

export type FLUXImg2ImgParams = FLUXParams & {
  imageBase64: string
  /** 0.0 = keep original, 1.0 = ignore original. Typical: 0.5–0.85 */
  denoise: number
}

export type WanT2VParams = {
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  frames: number
  steps: number
  cfg: number
  seed: number
}

export type WanI2VParams = WanT2VParams & {
  imageBase64: string
}

export type ModelList = {
  checkpoints: string[]
  unet: string[]
  vae: string[]
  textEncoders: string[]
  loras: string[]
}

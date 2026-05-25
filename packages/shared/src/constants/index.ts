export const GCP_DEFAULTS = {
  projectId: 'mktia-ai-studio',
  projectNumber: '448251250847',
  defaultZone: 'us-central1-a',
  defaultRegion: 'us-central1',
} as const

export const GCS_DEFAULTS = {
  projectId: 'mktia-ai-studio',
  bucketName: 'mktia-ai-studio-outputs',
} as const

export const RUNPOD_DEFAULTS = {
  apiBaseUrl: 'https://api.runpod.io/graphql',
  restBaseUrl: 'https://api.runpod.io/v2',
  defaultGpuType: 'NVIDIA A100-SXM4-80GB',
  defaultImage: 'ghcr.io/renatomayoral/nfsw-ai-studio:latest',
} as const

export const COMFYUI_DEFAULTS = {
  baseUrl: 'http://localhost:8188',
  wsPath: '/ws',
  pollIntervalMs: 1000,
  timeoutMs: 300_000,
} as const

export const STORAGE_COST_PER_GB_MONTH_USD = 0.02

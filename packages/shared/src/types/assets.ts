export type AssetType = 'image' | 'video'
export type CloudProvider = 'gcp' | 'runpod' | 'local'

export type AssetMetadata = {
  prompt: string
  negativePrompt?: string
  model: string
  steps: number
  cfg: number
  seed: number
  resolution: string
  durationMs: number
  generatedAt: string
  provider: CloudProvider
  gpu: string
}

export type GeneratedAsset = {
  id: string
  filename: string
  gcsPath: string
  downloadUrl?: string
  type: AssetType
  sizeBytes: number
  createdAt: Date
  metadata?: AssetMetadata
}

export type StorageStats = {
  totalFiles: number
  totalSizeBytes: number
  imageCount: number
  videoCount: number
  oldestAsset?: Date
  newestAsset?: Date
}

export type AssetFilter = {
  type?: AssetType | 'all'
  dateFrom?: Date
  dateTo?: Date
  model?: string
  provider?: 'gcp' | 'runpod'
  limit?: number
  offset?: number
}

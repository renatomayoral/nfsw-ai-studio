export type InstanceStatus = 'RUNNING' | 'STOPPED' | 'STARTING' | 'STOPPING' | 'UNKNOWN'

export type GPUMetrics = {
  vramUsedGB: number
  vramTotalGB: number
  gpuUtilizationPct: number
  temperatureC: number
}

export type BillingInfo = {
  creditRemainingUSD: number
  usedThisMonthUSD: number
  estimatedCostPerHour: number
  projectId?: string
}

export type InstanceConfig = {
  name: string
  machineType?: string
  zone?: string
  gpuType?: string
  gpuCount?: number
  diskSizeGb?: number
  image?: string
  startupScript?: string
  labels?: Record<string, string>
}

export type Instance = {
  id: string
  name: string
  status: InstanceStatus
  publicIp?: string
  zone?: string
  createdAt: Date
}

import type {
  InstanceConfig,
  Instance,
  InstanceStatus,
  GPUMetrics,
  BillingInfo,
} from '@repo/shared/types'

export interface CloudProvider {
  createInstance(config: InstanceConfig): Promise<Instance>
  startInstance(id: string): Promise<InstanceStatus>
  stopInstance(id: string): Promise<void>
  deleteInstance(id: string): Promise<void>
  getStatus(id: string): Promise<InstanceStatus>
  getMetrics(id: string): Promise<GPUMetrics>
  getBilling(): Promise<BillingInfo>
  runCommand(id: string, command: string): Promise<string>
  getTunnelUrl(id: string, port: number): Promise<string>
}

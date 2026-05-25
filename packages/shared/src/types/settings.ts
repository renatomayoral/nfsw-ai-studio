import { z } from 'zod'

export const AppSettingsSchema = z.object({
  cloudProvider: z.enum(['gcp', 'runpod']),
  gcpProjectId: z.string().default('mktia-ai-studio'),
  gcpProjectNumber: z.string().default('448251250847'),
  gcpInstanceName: z.string(),
  gcpZone: z.string().default('us-central1-a'),
  runpodApiKey: z.string().optional(),
  runpodGpuType: z.string().optional(),
  runpodPodId: z.string().optional(),
  runpodDockerImage: z
    .string()
    .default('ghcr.io/renatomayoral/nfsw-ai-studio:latest'),
  gcsBucketName: z.string().default('mktia-ai-studio-outputs'),
  autoUpload: z.boolean().default(true),
  hfToken: z.string(),
  autoShutdownHours: z.number().nullable(),
})

export type AppSettings = z.infer<typeof AppSettingsSchema>

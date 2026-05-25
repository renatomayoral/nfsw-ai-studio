import type { ComfyWorkflow, FLUXParams } from '@repo/shared/types'

export function createFLUXWorkflow(params: FLUXParams): ComfyWorkflow {
  const {
    prompt,
    negativePrompt = '',
    width = 1024,
    height = 1024,
    steps = 20,
    cfg = 3.5,
    seed = Math.floor(Math.random() * 2 ** 32),
  } = params

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'flux1-dev.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name1: 't5xxl_fp16.safetensors',
        clip_name2: 'clip_l.safetensors',
        type: 'flux',
      },
    },
    '3': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'ae.safetensors',
      },
    },
    '4': {
      class_type: 'CLIPTextEncodeFlux',
      inputs: {
        clip: ['2', 0],
        clip_l: prompt,
        t5xxl: prompt,
        guidance: cfg,
      },
    },
    '5': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['2', 0],
        text: negativePrompt,
      },
    },
    '6': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    '7': {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['4', 0],
        negative: ['5', 0],
        latent_image: ['6', 0],
        sampler_name: 'euler',
        scheduler: 'simple',
        steps,
        cfg,
        seed,
        denoise: 1.0,
      },
    },
    '8': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['7', 0],
        vae: ['3', 0],
      },
    },
    '9': {
      class_type: 'SaveImage',
      inputs: {
        images: ['8', 0],
        filename_prefix: 'flux',
      },
    },
  }
}

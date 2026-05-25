import type { ComfyWorkflow, WanT2VParams, WanI2VParams } from '@repo/shared/types'

export function createWanT2VWorkflow(params: WanT2VParams): ComfyWorkflow {
  const {
    prompt,
    negativePrompt = 'low quality, blurry, distorted',
    width = 832,
    height = 480,
    frames = 81,
    steps = 30,
    cfg = 6.0,
    seed = Math.floor(Math.random() * 2 ** 32),
  } = params

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'wan2.2_t2v_a14b_fp8_e4m3fn.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name1: 't5xxl_fp16.safetensors',
        type: 'wan',
      },
    },
    '3': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'wan_2.2_vae.safetensors',
      },
    },
    '4': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['2', 0],
        text: prompt,
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
      class_type: 'EmptyWanLatentVideo',
      inputs: {
        width,
        height,
        length: frames,
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
        scheduler: 'linear',
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
      class_type: 'VHS_VideoCombine',
      inputs: {
        images: ['8', 0],
        frame_rate: 24,
        loop_count: 0,
        filename_prefix: 'wan_t2v',
        format: 'video/h264-mp4',
        save_output: true,
      },
    },
  }
}

export function createWanI2VWorkflow(params: WanI2VParams): ComfyWorkflow {
  const {
    prompt,
    negativePrompt = 'low quality, blurry, distorted',
    width = 832,
    height = 480,
    frames = 81,
    steps = 30,
    cfg = 6.0,
    seed = Math.floor(Math.random() * 2 ** 32),
    imageBase64,
  } = params

  return {
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'wan2.2_i2v_a14b_fp8_e4m3fn.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name1: 't5xxl_fp16.safetensors',
        type: 'wan',
      },
    },
    '3': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'wan_2.2_vae.safetensors',
      },
    },
    '4': {
      class_type: 'ETN_LoadImageBase64',
      inputs: {
        image: imageBase64,
      },
    },
    '5': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['2', 0],
        text: prompt,
      },
    },
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['2', 0],
        text: negativePrompt,
      },
    },
    '7': {
      class_type: 'WanImageToVideo',
      inputs: {
        model: ['1', 0],
        positive: ['5', 0],
        negative: ['6', 0],
        image: ['4', 0],
        vae: ['3', 0],
        width,
        height,
        length: frames,
        steps,
        cfg,
        seed,
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
      class_type: 'VHS_VideoCombine',
      inputs: {
        images: ['8', 0],
        frame_rate: 24,
        loop_count: 0,
        filename_prefix: 'wan_i2v',
        format: 'video/h264-mp4',
        save_output: true,
      },
    },
  }
}

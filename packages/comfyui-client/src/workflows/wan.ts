import type { ComfyWorkflow, WanT2VParams, WanI2VParams } from '@repo/shared/types'

/**
 * Wan 2.2 Text-to-Video workflow
 *
 * Uses only the high_noise model on GPUs < 80GB VRAM (e.g. A100-40GB).
 * Loading both high_noise + low_noise simultaneously (~28GB UNet alone)
 * leaves no room for activations on 40GB GPUs.
 *
 * Models on disk:
 *  - diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors
 *  - text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors
 *  - vae/wan2.2_vae.safetensors
 */
export function createWanT2VWorkflow(params: WanT2VParams): ComfyWorkflow {
  const {
    prompt,
    negativePrompt = 'low quality, blurry, distorted, ugly, watermark',
    width = 832,
    height = 480,
    frames = 49,   // 49 frames = ~2s @ 24fps; safer on 40GB than 81
    steps = 30,
    cfg = 6.0,
    seed = Math.floor(Math.random() * 2 ** 32),
  } = params

  return {
    // ── Model loaders ──────────────────────────────────────────────────────
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        type: 'wan',
      },
    },
    '3': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'wan2.2_vae.safetensors',
      },
    },
    // ── Text encoding ──────────────────────────────────────────────────────
    '4': {
      class_type: 'CLIPTextEncode',
      inputs: { clip: ['2', 0], text: prompt },
    },
    '5': {
      class_type: 'CLIPTextEncode',
      inputs: { clip: ['2', 0], text: negativePrompt },
    },
    // ── Latent ────────────────────────────────────────────────────────────
    '6': {
      class_type: 'EmptyWanLatentVideo',
      inputs: { width, height, length: frames, batch_size: 1 },
    },
    // ── Sampling ──────────────────────────────────────────────────────────
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
    // ── Decode + Save ─────────────────────────────────────────────────────
    '8': {
      class_type: 'VAEDecode',
      inputs: { samples: ['7', 0], vae: ['3', 0] },
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

/**
 * Wan 2.2 Image-to-Video workflow (two-stage diffusion)
 *
 * Models on disk:
 *  - diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors
 *  - diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors
 *  - text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors
 *  - vae/wan2.2_vae.safetensors
 *
 * Uses WanImageToVideo node for the initial image conditioning,
 * then refines with the low_noise model via KSampler.
 */
export function createWanI2VWorkflow(params: WanI2VParams): ComfyWorkflow {
  const {
    prompt,
    negativePrompt = 'low quality, blurry, distorted, ugly, watermark',
    width = 832,
    height = 480,
    frames = 81,
    steps = 30,
    cfg = 6.0,
    seed = Math.floor(Math.random() * 2 ** 32),
    imageBase64,
  } = params

  const stepsLow = Math.max(1, Math.round(steps * 0.4))

  return {
    // ── Model loaders ──────────────────────────────────────────────────────
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name: 'wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '3': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
        type: 'wan',
      },
    },
    '4': {
      class_type: 'VAELoader',
      inputs: {
        vae_name: 'wan2.2_vae.safetensors',
      },
    },
    // ── Load input image ──────────────────────────────────────────────────
    '5': {
      class_type: 'ETN_LoadImageBase64',
      inputs: {
        image: imageBase64,
      },
    },
    // ── Text encoding ──────────────────────────────────────────────────────
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['3', 0],
        text: prompt,
      },
    },
    '7': {
      class_type: 'CLIPTextEncode',
      inputs: {
        clip: ['3', 0],
        text: negativePrompt,
      },
    },
    // ── Stage 1: image-conditioned high_noise sampling ────────────────────
    // WanImageToVideo encodes the input image into the latent space and
    // runs the first diffusion stage (high_noise) with image conditioning.
    '8': {
      class_type: 'WanImageToVideo',
      inputs: {
        model: ['1', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        image: ['5', 0],
        vae: ['4', 0],
        width,
        height,
        length: frames,
        steps: Math.max(1, steps - stepsLow),
        cfg,
        seed,
      },
    },
    // ── Stage 2: low_noise refinement ─────────────────────────────────────
    '9': {
      class_type: 'KSampler',
      inputs: {
        model: ['2', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['8', 0],
        sampler_name: 'euler',
        scheduler: 'linear',
        steps: stepsLow,
        cfg,
        seed,
        denoise: 0.5,
      },
    },
    // ── Decode + Save ─────────────────────────────────────────────────────
    '10': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['9', 0],
        vae: ['4', 0],
      },
    },
    '11': {
      class_type: 'VHS_VideoCombine',
      inputs: {
        images: ['10', 0],
        frame_rate: 24,
        loop_count: 0,
        filename_prefix: 'wan_i2v',
        format: 'video/h264-mp4',
        save_output: true,
      },
    },
  }
}

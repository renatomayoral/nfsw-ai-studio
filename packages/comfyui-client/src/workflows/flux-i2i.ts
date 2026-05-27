import type { ComfyWorkflow, FLUXImg2ImgParams } from '@repo/shared/types'

/**
 * FLUX.2-dev Image-to-Image workflow
 *
 * Encodes the input image into latent space via the VAE, then denoises with
 * the FLUX UNet at the given strength (denoise < 1.0 keeps structure from
 * the source image).
 *
 * Models on disk (same as txt2img):
 *  - diffusion_models/flux2_dev_fp8mixed.safetensors
 *  - text_encoders/mistral_3_small_flux2_fp8.safetensors
 *  - vae/flux2-vae.safetensors
 *
 * denoise guide:
 *   0.3–0.5  → light restyle, structure preserved
 *   0.55–0.75 → moderate transformation
 *   0.8–1.0  → heavy transformation (close to txt2img)
 */
export function createFLUXImg2ImgWorkflow(params: FLUXImg2ImgParams): ComfyWorkflow {
  const {
    prompt,
    width   = 832,
    height  = 1216,
    steps   = 20,
    cfg     = 3.5,
    seed    = Math.floor(Math.random() * 2 ** 32),
    imageBase64,
    denoise = 0.75,
  } = params

  const safeSeed   = Math.max(0, Math.floor(seed))
  const safeDenoise = Math.min(1, Math.max(0, denoise))

  return {
    // ── Model loaders ──────────────────────────────────────────────────────────
    '1': {
      class_type: 'UNETLoader',
      inputs: {
        unet_name:    'flux2_dev_fp8mixed.safetensors',
        weight_dtype: 'fp8_e4m3fn',
      },
    },
    '2': {
      class_type: 'CLIPLoader',
      inputs: {
        clip_name: 'mistral_3_small_flux2_fp8.safetensors',
        type:      'flux2',
      },
    },
    '3': {
      class_type: 'VAELoader',
      inputs: { vae_name: 'flux2-vae.safetensors' },
    },
    // ── Load input image ───────────────────────────────────────────────────────
    '4': {
      class_type: 'ETN_LoadImageBase64',
      inputs: { image: imageBase64 },
    },
    // ── Resize to target resolution ────────────────────────────────────────────
    '5': {
      class_type: 'ImageScale',
      inputs: {
        image:          ['4', 0],
        width,
        height,
        upscale_method: 'lanczos',
        crop:           'center',
      },
    },
    // ── Encode image to latent ─────────────────────────────────────────────────
    '6': {
      class_type: 'VAEEncode',
      inputs: {
        pixels: ['5', 0],
        vae:    ['3', 0],
      },
    },
    // ── Text encoding ──────────────────────────────────────────────────────────
    '7': {
      class_type: 'CLIPTextEncode',
      inputs: { clip: ['2', 0], text: prompt },
    },
    // ── FluxGuidance embeds CFG into conditioning ──────────────────────────────
    '8': {
      class_type: 'FluxGuidance',
      inputs: {
        conditioning: ['7', 0],
        guidance:     cfg,
      },
    },
    // ── Empty negative conditioning ────────────────────────────────────────────
    '9': {
      class_type: 'ConditioningZeroOut',
      inputs: { conditioning: ['7', 0] },
    },
    // ── Sampling (denoise < 1.0 preserves source structure) ───────────────────
    '10': {
      class_type: 'KSampler',
      inputs: {
        model:        ['1', 0],
        positive:     ['8', 0],
        negative:     ['9', 0],
        latent_image: ['6', 0],
        sampler_name: 'euler',
        scheduler:    'simple',
        steps,
        cfg:     1,       // guidance handled by FluxGuidance
        seed:    safeSeed,
        denoise: safeDenoise,
      },
    },
    // ── Decode + Save ──────────────────────────────────────────────────────────
    '11': {
      class_type: 'VAEDecode',
      inputs: { samples: ['10', 0], vae: ['3', 0] },
    },
    '12': {
      class_type: 'SaveImage',
      inputs: {
        images:          ['11', 0],
        filename_prefix: 'flux2_i2i',
      },
    },
  }
}

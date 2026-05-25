#!/bin/bash
# Download all models to /data/models
# Usage: HF_TOKEN=hf_xxx bash download_models.sh
#
# Wan 2.2 models: open access (no token needed)
# FLUX.1-dev:     gated — needs HF_TOKEN + accept terms at:
#                 https://huggingface.co/black-forest-labs/FLUX.1-dev
set -euo pipefail

HF_TOKEN="${HF_TOKEN:-}"
DATA_PATH="${DATA_PATH:-/data}"
MODELS_PATH="${DATA_PATH}/models"

echo "=== Downloading models ==="
echo "Wan 2.2 (~60GB) + FLUX.1-dev (~34GB, requires HF_TOKEN)"
echo ""

# ── Helper ────────────────────────────────────────────────────────────────────
download() {
    local url="$1"
    local dest="$2"
    local needs_token="${3:-false}"
    local filename
    filename=$(basename "${dest}")
    local dir
    dir=$(dirname "${dest}")

    if [ -f "${dest}" ]; then
        echo "✓ Skip (exists): ${filename} ($(du -sh "${dest}" | cut -f1))"
        return
    fi

    echo "⬇ ${filename}..."
    mkdir -p "${dir}"

    local auth_flag=""
    if [ "${needs_token}" = "true" ]; then
        if [ -z "${HF_TOKEN}" ]; then
            echo "  ⚠ Skipping — HF_TOKEN required for ${filename}"
            return
        fi
        auth_flag="--header=Authorization: Bearer ${HF_TOKEN}"
    fi

    aria2c \
        -x 16 -s 16 -k 1M \
        ${auth_flag:+"$auth_flag"} \
        -o "${filename}" \
        -d "${dir}" \
        --continue=true \
        --retry-wait=3 \
        --max-tries=5 \
        "${url}"
    echo "✓ ${filename} ($(du -sh "${dest}" | cut -f1))"
}

# ── Wan 2.2 T2V 14B FP8 — two-stage: high_noise + low_noise (~14GB each) ─────
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors"

download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors"

# ── Wan 2.2 I2V 14B FP8 — two-stage: high_noise + low_noise (~14GB each) ─────
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors"

download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors"

# ── Wan 2.2 Text Encoder: UMT5-XXL FP8 (~9GB) ────────────────────────────────
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors" \
    "${MODELS_PATH}/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors"

# ── Wan 2.2 VAE (~0.3GB) ──────────────────────────────────────────────────────
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan2.2_vae.safetensors" \
    "${MODELS_PATH}/vae/wan2.2_vae.safetensors"

# ── FLUX.2-dev (open, no token needed) ───────────────────────────────────────
# Better than FLUX.1-dev: improved quality + Mistral-3-Small text encoder
# https://huggingface.co/Comfy-Org/flux2-dev
echo ""
echo "Downloading FLUX.2-dev (~24GB)..."

download \
    "https://huggingface.co/Comfy-Org/flux2-dev/resolve/main/split_files/diffusion_models/flux2_dev_fp8mixed.safetensors" \
    "${MODELS_PATH}/diffusion_models/flux2_dev_fp8mixed.safetensors"

# FLUX.2 VAE
download \
    "https://huggingface.co/Comfy-Org/flux2-dev/resolve/main/split_files/vae/flux2-vae.safetensors" \
    "${MODELS_PATH}/vae/flux2-vae.safetensors"

# FLUX.2 Text Encoder: Mistral-3-Small FP8 (much better prompt understanding than T5-XXL)
download \
    "https://huggingface.co/Comfy-Org/flux2-dev/resolve/main/split_files/text_encoders/mistral_3_small_flux2_fp8.safetensors" \
    "${MODELS_PATH}/text_encoders/mistral_3_small_flux2_fp8.safetensors"

echo ""
echo "=== Download complete! ==="
echo "Total: $(du -sh "${MODELS_PATH}" | cut -f1)"
echo ""
echo "Models installed:"
find "${MODELS_PATH}" -name "*.safetensors" | sort | while read f; do
    size=$(du -sh "$f" | cut -f1)
    echo "  [$size] $(basename $f)"
done

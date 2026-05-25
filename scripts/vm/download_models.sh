#!/bin/bash
# Download all models to /data/models
# Usage: HF_TOKEN=hf_xxx bash download_models.sh
set -euo pipefail

HF_TOKEN="${HF_TOKEN:-}"
DATA_PATH="${DATA_PATH:-/data}"
MODELS_PATH="${DATA_PATH}/models"

if [ -z "${HF_TOKEN}" ]; then
    echo "ERROR: HF_TOKEN environment variable is required"
    echo "Get your token at: https://huggingface.co/settings/tokens"
    exit 1
fi

echo "=== Downloading models (~100GB) ==="
echo "This may take 30-40 minutes depending on your connection"
echo ""

download() {
    local url="$1"
    local dest="$2"
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
    aria2c \
        -x 16 -s 16 -k 1M \
        --header="Authorization: Bearer ${HF_TOKEN}" \
        -o "${filename}" \
        -d "${dir}" \
        --continue=true \
        --retry-wait=3 \
        --max-tries=5 \
        "${url}"
    echo "✓ ${filename} ($(du -sh "${dest}" | cut -f1))"
}

# Wan 2.2 T2V-A14B FP8 (~28GB)
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_models/resolve/main/split_files/diffusion_models/wan2.2_t2v_a14b_fp8_e4m3fn.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_t2v_a14b_fp8_e4m3fn.safetensors"

# Wan 2.2 I2V-A14B FP8 (~28GB)
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_models/resolve/main/split_files/diffusion_models/wan2.2_i2v_a14b_fp8_e4m3fn.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_i2v_a14b_fp8_e4m3fn.safetensors"

# FLUX.1-dev (~24GB)
download \
    "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux1-dev.safetensors" \
    "${MODELS_PATH}/unet/flux1-dev.safetensors"

# T5-XXL FP16 (~9GB)
download \
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors" \
    "${MODELS_PATH}/text_encoders/t5xxl_fp16.safetensors"

# CLIP-L (~0.5GB)
download \
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors" \
    "${MODELS_PATH}/text_encoders/clip_l.safetensors"

# FLUX VAE (~0.3GB)
download \
    "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/ae.safetensors" \
    "${MODELS_PATH}/vae/ae.safetensors"

# Wan VAE (~0.3GB)
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_models/resolve/main/split_files/vae/wan_2.2_vae.safetensors" \
    "${MODELS_PATH}/vae/wan_2.2_vae.safetensors"

echo ""
echo "=== Download complete! ==="
echo "Total size: $(du -sh "${MODELS_PATH}" | cut -f1)"

#!/bin/bash
set -e

HF_TOKEN="${HF_TOKEN:-}"
DATA_PATH="${DATA_PATH:-/data}"
MODELS_PATH="${DATA_PATH}/models"

if [ -z "${HF_TOKEN}" ]; then
    echo "ERROR: HF_TOKEN not set"
    exit 1
fi

echo "=== Downloading models to ${MODELS_PATH} ==="
echo "This will download ~100GB and may take 30-40 minutes"

# aria2c config for fast parallel downloads
ARIA2_OPTS="-x 16 -s 16 -k 1M --header='Authorization: Bearer ${HF_TOKEN}'"

download() {
    local url="$1"
    local dest="$2"
    local filename
    filename=$(basename "${dest}")

    if [ -f "${dest}" ]; then
        echo "✓ Already exists: ${filename}"
        return
    fi

    echo "⬇ Downloading: ${filename}"
    mkdir -p "$(dirname "${dest}")"
    aria2c ${ARIA2_OPTS} \
        --header="Authorization: Bearer ${HF_TOKEN}" \
        -o "${filename}" \
        -d "$(dirname "${dest}")" \
        "${url}"
    echo "✓ Done: ${filename}"
}

# Wan 2.2 T2V-A14B FP8
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_models/resolve/main/split_files/diffusion_models/wan2.2_t2v_a14b_fp8_e4m3fn.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_t2v_a14b_fp8_e4m3fn.safetensors"

# Wan 2.2 I2V-A14B FP8
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_models/resolve/main/split_files/diffusion_models/wan2.2_i2v_a14b_fp8_e4m3fn.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_i2v_a14b_fp8_e4m3fn.safetensors"

# FLUX.1-dev
download \
    "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux1-dev.safetensors" \
    "${MODELS_PATH}/unet/flux1-dev.safetensors"

# T5-XXL FP16
download \
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors" \
    "${MODELS_PATH}/text_encoders/t5xxl_fp16.safetensors"

# CLIP-L
download \
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors" \
    "${MODELS_PATH}/text_encoders/clip_l.safetensors"

# FLUX VAE (ae)
download \
    "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/ae.safetensors" \
    "${MODELS_PATH}/vae/ae.safetensors"

# Wan VAE
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_models/resolve/main/split_files/vae/wan_2.2_vae.safetensors" \
    "${MODELS_PATH}/vae/wan_2.2_vae.safetensors"

echo ""
echo "=== All models downloaded! ==="
du -sh "${MODELS_PATH}"

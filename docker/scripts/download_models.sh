#!/bin/bash
set -e

HF_TOKEN="${HF_TOKEN:-}"
DATA_PATH="${DATA_PATH:-/data}"
MODELS_PATH="${DATA_PATH}/models"

echo "=== Downloading models to ${MODELS_PATH} ==="
echo "This will download ~100GB and may take 30-40 minutes"

# ── Helper ────────────────────────────────────────────────────────────────────
download() {
    local url="$1"
    local dest="$2"
    local needs_token="${3:-false}"
    local filename
    filename=$(basename "${dest}")

    if [ -f "${dest}" ]; then
        echo "✓ Already exists: ${filename}"
        return
    fi

    echo "⬇ Downloading: ${filename}"
    mkdir -p "$(dirname "${dest}")"

    local auth_header=""
    if [ "${needs_token}" = "true" ]; then
        if [ -z "${HF_TOKEN}" ]; then
            echo "ERROR: HF_TOKEN required for ${filename} but not set"
            exit 1
        fi
        auth_header="--header=Authorization: Bearer ${HF_TOKEN}"
    fi

    aria2c \
        -x 16 -s 16 -k 1M \
        ${auth_header:+"$auth_header"} \
        -o "${filename}" \
        -d "$(dirname "${dest}")" \
        "${url}"
    echo "✓ Done: ${filename}"
}

# ── Wan 2.2 T2V 14B FP8 (open, no token needed) ──────────────────────────────
# Wan 2.2 uses two-stage denoising: high_noise + low_noise models
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors"

download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors"

# ── Wan 2.2 I2V 14B FP8 (open, no token needed) ──────────────────────────────
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors"

download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors" \
    "${MODELS_PATH}/diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors"

# ── Wan 2.2 Text Encoder: UMT5-XXL FP8 (open, no token needed) ───────────────
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors" \
    "${MODELS_PATH}/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors"

# ── Wan 2.2 VAE (open, no token needed) ──────────────────────────────────────
download \
    "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan2.2_vae.safetensors" \
    "${MODELS_PATH}/vae/wan2.2_vae.safetensors"

# ── FLUX.1-dev (GATED — requires HF_TOKEN + accepted terms on HF) ─────────────
# Accept terms at: https://huggingface.co/black-forest-labs/FLUX.1-dev
if [ -n "${HF_TOKEN}" ]; then
    echo ""
    echo "HF_TOKEN found — downloading FLUX.1-dev models..."

    download \
        "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/flux1-dev.safetensors" \
        "${MODELS_PATH}/unet/flux1-dev.safetensors" \
        "true"

    download \
        "https://huggingface.co/black-forest-labs/FLUX.1-dev/resolve/main/ae.safetensors" \
        "${MODELS_PATH}/vae/ae.safetensors" \
        "true"

    # T5-XXL and CLIP-L for FLUX (open repo)
    download \
        "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors" \
        "${MODELS_PATH}/text_encoders/t5xxl_fp16.safetensors"

    download \
        "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors" \
        "${MODELS_PATH}/text_encoders/clip_l.safetensors"
else
    echo ""
    echo "⚠ HF_TOKEN not set — skipping FLUX.1-dev (image generation)"
    echo "  Set HF_TOKEN and accept terms at:"
    echo "  https://huggingface.co/black-forest-labs/FLUX.1-dev"
fi

echo ""
echo "=== Download complete! ==="
du -sh "${MODELS_PATH}"
echo ""
echo "Models installed:"
find "${MODELS_PATH}" -name "*.safetensors" | sort | while read f; do
    size=$(du -sh "$f" | cut -f1)
    echo "  [$size] $(basename $f)"
done

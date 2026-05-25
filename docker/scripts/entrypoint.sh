#!/bin/bash
set -e

DATA_PATH="${DATA_PATH:-/data}"
GCS_BUCKET="${GCS_BUCKET:-mktia-ai-studio-outputs}"
COMFYUI_PATH="${COMFYUI_PATH:-/app/ComfyUI}"

echo "=== NFSW AI Studio ==="
echo "Data path: ${DATA_PATH}"
echo "GCS bucket: ${GCS_BUCKET}"

# Detect available VRAM
VRAM_GB=0
if command -v nvidia-smi &>/dev/null; then
    VRAM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 || echo "0")
    VRAM_GB=$(( VRAM_MB / 1024 ))
    echo "Detected VRAM: ${VRAM_GB}GB"
fi

# Set ComfyUI flags based on VRAM
if [ "${VRAM_GB}" -ge 70 ]; then
    COMFYUI_FLAGS="--gpu-only --bf16-unet"
elif [ "${VRAM_GB}" -ge 38 ]; then
    COMFYUI_FLAGS="--gpu-only --fp8_e4m3fn"
else
    COMFYUI_FLAGS="--gpu-only --fp8_e4m3fn --lowvram"
fi

echo "ComfyUI flags: ${COMFYUI_FLAGS}"

# Start GCS watcher in background
if [ -n "${GCS_BUCKET}" ]; then
    /app/scripts/save_metadata.sh "${DATA_PATH}/outputs" "${GCS_BUCKET}" &
    echo "GCS watcher started (bucket: ${GCS_BUCKET})"
fi

# Start ComfyUI
cd "${COMFYUI_PATH}"
exec python3 main.py \
    --listen 0.0.0.0 \
    --port 8188 \
    ${COMFYUI_FLAGS}

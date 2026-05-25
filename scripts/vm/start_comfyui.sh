#!/bin/bash
# Start ComfyUI with optimal flags based on detected VRAM
# Also starts the GCS output watcher
set -euo pipefail

DATA_PATH="${DATA_PATH:-/data}"
GCS_BUCKET="${GCS_BUCKET:-mktia-ai-studio-outputs}"
CLOUD_PROVIDER="${CLOUD_PROVIDER:-gcp}"
COMFYUI_PATH="${COMFYUI_PATH:-${HOME}/ComfyUI}"

echo "=== Starting NFSW AI Studio ==="

# Detect VRAM
VRAM_GB=0
if command -v nvidia-smi &>/dev/null; then
    VRAM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 || echo "0")
    VRAM_GB=$(( VRAM_MB / 1024 ))
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1 || echo "Unknown GPU")
    echo "GPU: ${GPU_NAME} (${VRAM_GB}GB VRAM)"
fi

# Choose flags
if [ "${VRAM_GB}" -ge 70 ]; then
    COMFYUI_FLAGS="--gpu-only --bf16-unet"
    echo "Mode: High VRAM (≥70GB) — bf16"
elif [ "${VRAM_GB}" -ge 38 ]; then
    COMFYUI_FLAGS="--gpu-only --fp8_e4m3fn"
    echo "Mode: Medium VRAM (≥38GB) — fp8"
else
    COMFYUI_FLAGS="--gpu-only --fp8_e4m3fn --lowvram"
    echo "Mode: Low VRAM (<38GB) — fp8 + lowvram"
fi

# Start GCS watcher in background
if command -v inotifywait &>/dev/null && [ -n "${GCS_BUCKET}" ]; then
    echo "Starting GCS watcher → gs://${GCS_BUCKET}/${CLOUD_PROVIDER}/"
    (
        inotifywait -m -e close_write,moved_to \
            --format '%w%f' \
            "${DATA_PATH}/outputs" 2>/dev/null |
        while read -r filepath; do
            filename=$(basename "${filepath}")
            ext="${filename##*.}"
            case "${ext,,}" in
                png|jpg|jpeg|webp|mp4|webm)
                    gcs_path="${CLOUD_PROVIDER}/${filename}"
                    echo "Uploading: ${filename}"
                    gcloud storage cp "${filepath}" "gs://${GCS_BUCKET}/${gcs_path}" \
                        --project=mktia-ai-studio 2>/dev/null && \
                        echo "✓ Uploaded: ${filename}" || \
                        echo "✗ Upload failed: ${filename}"
                    ;;
            esac
        done
    ) &
    GCS_WATCHER_PID=$!
    echo "GCS watcher PID: ${GCS_WATCHER_PID}"
fi

# SSH tunnel reminder
echo ""
echo "To access ComfyUI locally:"
echo "  gcloud compute ssh $(hostname) --project=mktia-ai-studio -- -L 8188:localhost:8188 -N &"
echo "  Then open: http://localhost:8188"
echo ""

# Start ComfyUI
cd "${COMFYUI_PATH}"
echo "Starting ComfyUI (listen 127.0.0.1:8188)..."
exec python3 main.py \
    --listen 127.0.0.1 \
    --port 8188 \
    ${COMFYUI_FLAGS}

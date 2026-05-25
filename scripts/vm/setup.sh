#!/bin/bash
# Setup script for GCP VM — run once after creating the instance
# Usage: gcloud compute ssh $INSTANCE --project=mktia-ai-studio -- 'bash -s' < setup.sh
set -euo pipefail

DATA_DISK="${DATA_DISK:-/dev/sdb}"
DATA_PATH="${DATA_PATH:-/data}"
GCS_BUCKET="${GCS_BUCKET:-mktia-ai-studio-outputs}"
HF_TOKEN="${HF_TOKEN:-}"

echo "=== NFSW AI Studio VM Setup ==="
echo "Data disk: ${DATA_DISK}"
echo "Data path: ${DATA_PATH}"

# Format and mount data disk if not already mounted
if ! mountpoint -q "${DATA_PATH}"; then
    echo "Formatting and mounting ${DATA_DISK}..."
    sudo mkfs.ext4 -F "${DATA_DISK}"
    sudo mkdir -p "${DATA_PATH}"
    sudo mount "${DATA_DISK}" "${DATA_PATH}"
    echo "${DATA_DISK} ${DATA_PATH} ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab
    echo "✓ Disk mounted at ${DATA_PATH}"
fi

# System deps
echo "Installing system dependencies..."
sudo apt-get update -q
sudo apt-get install -y --no-install-recommends \
    python3.10 python3-pip python3.10-venv \
    git git-lfs curl wget aria2 \
    inotify-tools ffmpeg \
    libgl1-mesa-glx libglib2.0-0

# Create directories
sudo mkdir -p \
    "${DATA_PATH}/models/diffusion_models" \
    "${DATA_PATH}/models/text_encoders" \
    "${DATA_PATH}/models/vae" \
    "${DATA_PATH}/models/unet" \
    "${DATA_PATH}/models/loras" \
    "${DATA_PATH}/outputs" \
    "${DATA_PATH}/inputs"

sudo chown -R "${USER}:${USER}" "${DATA_PATH}"

# Install PyTorch
echo "Installing PyTorch..."
pip3 install --user --no-cache-dir \
    torch==2.4.1+cu121 torchvision==0.19.1+cu121 torchaudio==2.4.1+cu121 \
    --index-url https://download.pytorch.org/whl/cu121

# Clone ComfyUI
COMFYUI_PATH="/home/${USER}/ComfyUI"
if [ ! -d "${COMFYUI_PATH}" ]; then
    echo "Cloning ComfyUI..."
    git clone --depth=1 https://github.com/comfyanonymous/ComfyUI.git "${COMFYUI_PATH}"
    pip3 install --user --no-cache-dir -r "${COMFYUI_PATH}/requirements.txt"
fi

# Custom nodes
cd "${COMFYUI_PATH}/custom_nodes"

install_node() {
    local repo="$1"
    local name
    name=$(basename "${repo}" .git)
    if [ ! -d "${name}" ]; then
        git clone --depth=1 "${repo}"
        [ -f "${name}/requirements.txt" ] && pip3 install --user --no-cache-dir -r "${name}/requirements.txt" 2>/dev/null || true
        echo "✓ Installed: ${name}"
    fi
}

install_node "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git"
install_node "https://github.com/kijai/ComfyUI-WanVideoWrapper.git"
install_node "https://github.com/pythongosssss/ComfyUI-Custom-Scripts.git"

# extra_model_paths.yaml
cat > "${COMFYUI_PATH}/extra_model_paths.yaml" << 'YAML'
comfyui:
  base_path: /data/models
  checkpoints: checkpoints/
  clip: text_encoders/
  diffusion_models: diffusion_models/
  loras: loras/
  unet: unet/
  vae: vae/
YAML

# Create bucket if not exists
echo "Ensuring GCS bucket..."
gcloud storage buckets create "gs://${GCS_BUCKET}" \
    --project=mktia-ai-studio \
    --location=us-central1 \
    --uniform-bucket-level-access 2>/dev/null || echo "(bucket already exists)"

echo ""
echo "=== Setup complete! ==="
echo "Next steps:"
echo "  1. Run: HF_TOKEN=<token> bash scripts/vm/download_models.sh"
echo "  2. Run: bash scripts/vm/start_comfyui.sh"

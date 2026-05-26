FROM nvidia/cuda:12.1.1-cudnn8-devel-ubuntu22.04

LABEL org.opencontainers.image.source=https://github.com/renatomayoral/nfsw-ai-studio
LABEL org.opencontainers.image.description="NFSW AI Studio - ComfyUI + Wan 2.2 + FLUX.1"

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV COMFYUI_PATH=/app/ComfyUI
ENV DATA_PATH=/data

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-pip \
    python3.10-venv \
    git \
    git-lfs \
    curl \
    wget \
    aria2 \
    inotify-tools \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Google Cloud SDK
RUN curl -sSL https://sdk.cloud.google.com | bash -s -- --disable-prompts --install-dir=/opt
ENV PATH="/opt/google-cloud-sdk/bin:${PATH}"

# Python alias
RUN ln -sf /usr/bin/python3.10 /usr/bin/python3 && \
    ln -sf /usr/bin/python3 /usr/bin/python

# Upgrade pip
RUN pip3 install --no-cache-dir --upgrade pip

# Install PyTorch with CUDA 12.1
RUN pip3 install --no-cache-dir \
    torch==2.4.1+cu121 \
    torchvision==0.19.1+cu121 \
    torchaudio==2.4.1+cu121 \
    --index-url https://download.pytorch.org/whl/cu121

# Clone ComfyUI
RUN git clone --depth=1 https://github.com/comfyanonymous/ComfyUI.git ${COMFYUI_PATH}

# Install ComfyUI requirements
RUN pip3 install --no-cache-dir -r ${COMFYUI_PATH}/requirements.txt

# Install custom nodes
WORKDIR ${COMFYUI_PATH}/custom_nodes

RUN git clone --depth=1 https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git && \
    pip3 install --no-cache-dir -r ComfyUI-VideoHelperSuite/requirements.txt

RUN git clone --depth=1 https://github.com/kijai/ComfyUI-WanVideoWrapper.git && \
    pip3 install --no-cache-dir -r ComfyUI-WanVideoWrapper/requirements.txt 2>/dev/null || true && \
    pip3 install --no-cache-dir transformers>=4.45.0 tokenizers sentencepiece

RUN git clone --depth=1 https://github.com/Fannovel16/comfyui_controlnet_aux.git && \
    pip3 install --no-cache-dir -r comfyui_controlnet_aux/requirements.txt 2>/dev/null || true

RUN git clone --depth=1 https://github.com/pythongosssss/ComfyUI-Custom-Scripts.git

# Copy extra_model_paths config
COPY extra_model_paths.yaml ${COMFYUI_PATH}/extra_model_paths.yaml

# Copy startup scripts
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

# Create data directories (models live on mounted volume)
RUN mkdir -p \
    ${DATA_PATH}/models/diffusion_models \
    ${DATA_PATH}/models/text_encoders \
    ${DATA_PATH}/models/vae \
    ${DATA_PATH}/models/unet \
    ${DATA_PATH}/models/loras \
    ${DATA_PATH}/outputs \
    ${DATA_PATH}/inputs

WORKDIR ${COMFYUI_PATH}

EXPOSE 8188

ENTRYPOINT ["/app/scripts/entrypoint.sh"]

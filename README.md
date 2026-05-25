# 🎬 NFSW AI Studio

Dashboard para geração de vídeo e imagem com IA no Google Cloud Platform.

**Stack**: ComfyUI + Wan 2.2 + FLUX.1 | Next.js 16 | Turborepo | TypeScript

---

## Visão Geral

| Recurso | Detalhe |
|---------|---------|
| **GCP Project** | `mktia-ai-studio` (448251250847) |
| **GCS Bucket** | `mktia-ai-studio-outputs` |
| **Zona padrão** | `us-central1-a` |
| **Docker Registry** | `ghcr.io/renatomayoral/nfsw-ai-studio:latest` |

---

## Pré-requisitos

- Node.js ≥ 20
- pnpm ≥ 9
- `gcloud` CLI autenticado: `gcloud auth application-default login`
- (Para VM) GPU NVIDIA com ≥38GB VRAM

---

## Estrutura

```
nfsw-ai-studio/
├── apps/web/              # Next.js 16 dashboard
├── packages/
│   ├── shared/            # Tipos TypeScript e utilitários
│   ├── ui/                # shadcn/ui componentes
│   ├── gcs-storage/       # Google Cloud Storage client
│   ├── cloud-infra/       # GCP + RunPod providers
│   └── comfyui-client/    # ComfyUI API client + workflows
├── docker/                # Dockerfile + scripts de container
├── scripts/vm/            # Scripts para VM GCP
└── .github/workflows/     # CI/CD
```

---

## Setup Local (Dashboard)

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com seus valores

# 3. Iniciar dev server
pnpm dev
```

Acesse em [http://localhost:3000](http://localhost:3000)

---

## Setup VM GCP

### 1. Criar a VM

```bash
gcloud compute instances create ai-studio-vm \
  --project=mktia-ai-studio \
  --zone=us-central1-a \
  --machine-type=n1-standard-8 \
  --accelerator=type=nvidia-tesla-a100,count=1 \
  --maintenance-policy=TERMINATE \
  --boot-disk-size=100GB \
  --boot-disk-type=pd-ssd \
  --create-disk=name=ai-studio-data,size=500GB,type=pd-ssd \
  --image-family=common-cu121-debian-11-py310 \
  --image-project=deeplearning-platform-release
```

### 2. Setup inicial

```bash
gcloud compute ssh ai-studio-vm --project=mktia-ai-studio -- 'bash -s' < scripts/vm/setup.sh
```

### 3. Baixar modelos (~100GB, 30-40min)

```bash
gcloud compute ssh ai-studio-vm --project=mktia-ai-studio \
  --command="HF_TOKEN=hf_xxx DATA_PATH=/data bash /tmp/download_models.sh"
```

### 4. Iniciar ComfyUI

```bash
# Na VM:
bash scripts/vm/start_comfyui.sh

# Criar SSH tunnel local:
gcloud compute ssh ai-studio-vm --project=mktia-ai-studio -- -L 8188:localhost:8188 -N &
```

---

## Docker (RunPod)

A imagem Docker contém ComfyUI + custom nodes mas **não os modelos** (ficam no volume `/data`).

```bash
# Build local
docker build -t nfsw-ai-studio ./docker

# A imagem é publicada automaticamente via GitHub Actions
# ghcr.io/renatomayoral/nfsw-ai-studio:latest
```

---

## Modelos

| Modelo | Tamanho | Path |
|--------|---------|------|
| Wan 2.2 T2V-A14B FP8 | ~28GB | `diffusion_models/` |
| Wan 2.2 I2V-A14B FP8 | ~28GB | `diffusion_models/` |
| FLUX.1-dev | ~24GB | `unet/` |
| T5-XXL FP16 | ~9GB | `text_encoders/` |
| CLIP-L | ~0.5GB | `text_encoders/` |
| VAE (ae + wan) | ~0.6GB | `vae/` |
| **Total** | **~100GB** | |

---

## API Routes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/vm/start` | Iniciar VM/Pod |
| `POST` | `/api/vm/stop` | Parar VM/Pod |
| `DELETE` | `/api/vm` | Deletar Pod (RunPod only) |
| `GET` | `/api/vm/status` | Status e métricas GPU |
| `POST` | `/api/generate` | Submeter job ao ComfyUI |
| `GET` | `/api/generate/[jobId]/status` | SSE stream de progresso |
| `GET` | `/api/library` | Listar assets do GCS |
| `GET` | `/api/library/stats` | Stats do bucket |
| `GET` | `/api/library/[id]/download` | Signed URL de download |
| `DELETE` | `/api/library/[id]` | Deletar asset |
| `GET` | `/api/credits` | Saldo de créditos |
| `GET` | `/api/health` | Health check |

---

## CI/CD

O GitHub Actions ([.github/workflows/docker-build.yml](.github/workflows/docker-build.yml)) builda e publica automaticamente a imagem Docker no GHCR quando há mudanças em `docker/`.

---

## Licença

MIT

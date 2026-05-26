#!/bin/bash
# ─── Deploy web app to Cloud Run ──────────────────────────────────────────────
# Prerequisites:
#   - docker group active (run `newgrp docker` or open fresh terminal after usermod)
#   - gcloud auth login --account=lbh@liberlaser.com
#   - gcloud auth configure-docker us-central1-docker.pkg.dev
#
# Usage: bash scripts/deploy-web.sh
set -euo pipefail

PROJECT="mktia-ai-studio"
REGION="us-central1"
REGISTRY="us-central1-docker.pkg.dev/$PROJECT/ai-studio"
SERVICE="ai-studio-web"
IMAGE="$REGISTRY/web"
SHORT_SHA=$(git rev-parse --short HEAD)

echo "=== Deploy Web → Cloud Run ==="
echo "Image : $IMAGE:$SHORT_SHA"
echo "Service: $SERVICE ($REGION)"
echo ""

# ─── 1. Build ─────────────────────────────────────────────────────────────────
echo "→ Building Docker image..."
docker build \
  --file apps/web/Dockerfile \
  --tag "$IMAGE:$SHORT_SHA" \
  --tag "$IMAGE:latest" \
  .
echo "  ✓ Build complete"

# ─── 2. Push ──────────────────────────────────────────────────────────────────
echo ""
echo "→ Pushing to Artifact Registry..."
docker push "$IMAGE:$SHORT_SHA"
docker push "$IMAGE:latest"
echo "  ✓ Push complete"

# ─── 3. Deploy ────────────────────────────────────────────────────────────────
echo ""
echo "→ Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE:$SHORT_SHA" \
  --platform managed \
  --region "$REGION" \
  --project "$PROJECT" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-secrets "BETTER_AUTH_SECRET=better-auth-secret:latest" \
  --set-secrets "BETTER_AUTH_URL=better-auth-url:latest" \
  --set-secrets "GOOGLE_CLIENT_ID=google-client-id:latest" \
  --set-secrets "GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --set-secrets "DATABASE_URL=database-url:latest" \
  --set-secrets "STRIPE_SECRET_KEY=stripe-secret-key:latest" \
  --set-secrets "STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest" \
  --set-env-vars "NEXT_PUBLIC_APP_URL=https://ai-studio-web-$(gcloud projects describe $PROJECT --format='value(projectNumber)').us-central1.run.app" \
  --set-env-vars "NODE_ENV=production"

echo ""
echo "  ✓ Deploy complete!"
echo ""
echo "Service URL:"
gcloud run services describe "$SERVICE" \
  --platform managed \
  --region "$REGION" \
  --project "$PROJECT" \
  --format 'value(status.url)'

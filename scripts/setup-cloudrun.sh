#!/bin/bash
# ─── AI Studio — Cloud Run Setup Script ───────────────────────────────────────
# Run this once after: gcloud auth application-default login
# (make sure to login as renatomayoral@gmail.com)
#
# Usage: bash scripts/setup-cloudrun.sh
set -euo pipefail

PROJECT="mktia-ai-studio"
REGION="us-central1"
REPO="renatomayoral/nfsw-ai-studio"

echo "=== AI Studio Cloud Run Setup ==="
echo "Project: $PROJECT"
echo ""

# ─── 1. Enable APIs ───────────────────────────────────────────────────────────
echo "→ Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT" --quiet
echo "  ✓ APIs enabled"

# ─── 2. Grant Cloud Build SA permissions ──────────────────────────────────────
echo ""
echo "→ Granting Cloud Build permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

for ROLE in \
  "roles/run.admin" \
  "roles/iam.serviceAccountUser" \
  "roles/secretmanager.secretAccessor" \
  "roles/artifactregistry.writer"; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:$CB_SA" \
    --role="$ROLE" \
    --quiet
  echo "  ✓ $ROLE → Cloud Build SA"
done

# ─── 3. Create Secret Manager secrets ─────────────────────────────────────────
echo ""
echo "→ Creating secrets in Secret Manager..."

BETTER_AUTH_SECRET=$(openssl rand -base64 32)

create_secret() {
  local NAME=$1; local VALUE=$2
  if gcloud secrets describe "$NAME" --project="$PROJECT" &>/dev/null; then
    echo "  ~ $NAME already exists, adding new version"
    echo -n "$VALUE" | gcloud secrets versions add "$NAME" --data-file=- --project="$PROJECT"
  else
    echo -n "$VALUE" | gcloud secrets create "$NAME" \
      --data-file=- \
      --replication-policy=automatic \
      --project="$PROJECT"
    echo "  ✓ $NAME created"
  fi
}

# Auto-generated
create_secret "better-auth-secret" "$BETTER_AUTH_SECRET"

# Placeholder — update after Cloud Run first deploy (you'll get the URL)
create_secret "better-auth-url"    "https://ai-studio-web-TO_BE_UPDATED.a.run.app"

# Empty placeholders — user must update these
for SECRET in google-client-id google-client-secret database-url stripe-secret-key stripe-webhook-secret; do
  create_secret "$SECRET" "PLACEHOLDER"
done

echo ""
echo "  ⚠️  Update these secrets with real values:"
echo "  gcloud secrets versions add google-client-id     --data-file=- --project=$PROJECT <<< 'YOUR_ID'"
echo "  gcloud secrets versions add google-client-secret --data-file=- --project=$PROJECT <<< 'YOUR_SECRET'"
echo "  gcloud secrets versions add database-url         --data-file=- --project=$PROJECT <<< 'postgresql://...'"
echo "  gcloud secrets versions add stripe-secret-key    --data-file=- --project=$PROJECT <<< 'sk_live_...'"
echo "  gcloud secrets versions add stripe-webhook-secret --data-file=- --project=$PROJECT <<< 'whsec_...'"

# ─── 4. Create Cloud Build Trigger ────────────────────────────────────────────
echo ""
echo "→ Creating Cloud Build Trigger..."
echo "  Note: First connect your GitHub repo in Cloud Build console if not done yet:"
echo "  https://console.cloud.google.com/cloud-build/triggers/connect?project=$PROJECT"
echo ""

# Create trigger via gcloud
gcloud builds triggers create github \
  --name="web-deploy" \
  --repo-name="nfsw-ai-studio" \
  --repo-owner="renatomayoral" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.web.yaml" \
  --included-files="apps/web/**,packages/**,cloudbuild.web.yaml" \
  --project="$PROJECT" \
  --region="global" 2>/dev/null || echo "  ~ Trigger may already exist or GitHub not connected yet"

# ─── 5. Create Cloud SQL DB and user ──────────────────────────────────────────
echo ""
echo "→ Setting up Cloud SQL database..."
SQL_STATUS=$(gcloud sql instances describe aistudio --project="$PROJECT" --format='value(state)' 2>/dev/null || echo "NOT_FOUND")

if [ "$SQL_STATUS" = "RUNNABLE" ]; then
  # Create database
  gcloud sql databases create aistudio \
    --instance=aistudio \
    --project="$PROJECT" 2>/dev/null || echo "  ~ DB already exists"
  echo "  ✓ Database 'aistudio' ready"

  # Set postgres user password
  echo ""
  echo "  Set the postgres user password (you'll use this in DATABASE_URL):"
  read -s -p "  Password: " DB_PASS
  echo ""
  gcloud sql users set-password postgres \
    --instance=aistudio \
    --project="$PROJECT" \
    --password="$DB_PASS"

  # Store DATABASE_URL in secret
  SQL_IP=$(gcloud sql instances describe aistudio --project="$PROJECT" --format='value(ipAddresses[0].ipAddress)')
  DB_URL="postgresql://postgres:${DB_PASS}@${SQL_IP}/aistudio?sslmode=require"
  echo -n "$DB_URL" | gcloud secrets versions add database-url --data-file=- --project="$PROJECT"
  echo "  ✓ DATABASE_URL stored in Secret Manager"
  echo "  (Also update apps/web/.env.local with this URL for local dev)"
else
  echo "  ⚠️  Cloud SQL instance status: $SQL_STATUS"
  echo "  Run this script again once it's RUNNABLE, or set database-url manually"
fi

echo ""
echo "=== Done! ==="
echo ""
echo "Next steps:"
echo "1. Connect GitHub repo in Cloud Build (if not done):"
echo "   https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT"
echo ""
echo "2. Fill Google OAuth credentials:"
echo "   https://console.cloud.google.com/apis/credentials?project=$PROJECT"
echo "   Redirect URI: https://<YOUR-CLOUDRUN-URL>/api/auth/callback/google"
echo ""
echo "3. First deploy (manual trigger or push to main):"
echo "   gcloud builds submit --config=cloudbuild.web.yaml --project=$PROJECT"
echo ""
echo "4. After first deploy, update better-auth-url secret with the real Cloud Run URL"

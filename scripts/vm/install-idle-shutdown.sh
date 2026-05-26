#!/bin/bash
# ─── Instala o serviço de auto-shutdown por inatividade ───────────────────────
# Executar na VM: bash scripts/vm/install-idle-shutdown.sh
set -euo pipefail

INSTALL_DIR="/opt/ai-studio"
SCRIPT_SRC="$(dirname "$0")/idle-shutdown.sh"

echo "→ Instalando idle-shutdown..."

sudo mkdir -p "$INSTALL_DIR"
sudo cp "$SCRIPT_SRC" "$INSTALL_DIR/idle-shutdown.sh"
sudo chmod +x "$INSTALL_DIR/idle-shutdown.sh"

sudo cp "$(dirname "$0")/idle-shutdown.service" /etc/systemd/system/idle-shutdown.service

sudo systemctl daemon-reload
sudo systemctl enable idle-shutdown.service
sudo systemctl start  idle-shutdown.service

echo "✓ Instalado. Status:"
sudo systemctl status idle-shutdown.service --no-pager

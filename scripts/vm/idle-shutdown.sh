#!/bin/bash
# ─── ComfyUI Idle Shutdown ────────────────────────────────────────────────────
# Monitors ComfyUI queue every 60s. If idle for IDLE_MINUTES, shuts down VM.
# Installed as a systemd service — see idle-shutdown.service

IDLE_MINUTES="${IDLE_MINUTES:-30}"
CHECK_INTERVAL=60
COMFYUI_URL="http://localhost:8188"
IDLE_THRESHOLD=$((IDLE_MINUTES * 60))
idle_seconds=0

log() { echo "[idle-shutdown] $(date -u +%H:%M:%S) $*"; }

log "Started — will shut down after ${IDLE_MINUTES} min of inactivity"

while true; do
  sleep "$CHECK_INTERVAL"

  # Query ComfyUI queue
  queue=$(curl -sf --max-time 5 "$COMFYUI_URL/queue" 2>/dev/null)

  if [ $? -ne 0 ]; then
    # ComfyUI not responding yet (still starting up) — don't count as idle
    log "ComfyUI not responding — waiting for startup"
    idle_seconds=0
    continue
  fi

  running=$(echo "$queue" | python3 -c \
    "import sys,json; q=json.load(sys.stdin); print(len(q.get('queue_running',[])))" 2>/dev/null || echo "0")
  pending=$(echo "$queue" | python3 -c \
    "import sys,json; q=json.load(sys.stdin); print(len(q.get('queue_pending',[])))" 2>/dev/null || echo "0")

  if [ "$running" != "0" ] || [ "$pending" != "0" ]; then
    idle_seconds=0
    log "Active — running=${running} pending=${pending} — reset timer"
    continue
  fi

  # Also check if there are active WebSocket clients (someone has ComfyUI open)
  ws_clients=$(curl -sf --max-time 5 "$COMFYUI_URL/system_stats" 2>/dev/null | \
    python3 -c "import sys,json; s=json.load(sys.stdin); print(s.get('system',{}).get('comfyui_version',''))" 2>/dev/null)

  # Count connections to port 8188
  active_conns=$(ss -tn state established '( dport = :8188 or sport = :8188 )' 2>/dev/null | wc -l)

  idle_seconds=$((idle_seconds + CHECK_INTERVAL))
  remaining=$((IDLE_THRESHOLD - idle_seconds))
  log "Idle ${idle_seconds}s / ${IDLE_THRESHOLD}s — connections=${active_conns} — shutdown in ${remaining}s"

  if [ "$idle_seconds" -ge "$IDLE_THRESHOLD" ]; then
    log "Idle threshold reached — shutting down VM to save costs"
    # Give any in-flight uploads a moment to finish
    sleep 10
    sudo poweroff
    exit 0
  fi
done

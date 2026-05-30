#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$APP_DIR/server.pid"
LOG_FILE="$APP_DIR/server.log"
HOST="127.0.0.1"
PORT="8001"

is_running() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if is_running "$PID"; then
    echo "Already running: http://$HOST:$PORT/ (PID: $PID)"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

cd "$APP_DIR"
nohup python server.py >"$LOG_FILE" 2>&1 &
PID="$!"
echo "$PID" >"$PID_FILE"
sleep 1

if is_running "$PID"; then
  echo "Started: http://$HOST:$PORT/ (PID: $PID)"
  echo "Log: $LOG_FILE"
else
  rm -f "$PID_FILE"
  echo "Failed to start. Check log: $LOG_FILE" >&2
  exit 1
fi

#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$APP_DIR/server.pid"

is_running() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

if [[ ! -f "$PID_FILE" ]]; then
  echo "Not running: PID file was not found."
  exit 0
fi

PID="$(cat "$PID_FILE")"
if ! is_running "$PID"; then
  rm -f "$PID_FILE"
  echo "Not running: stale PID file removed."
  exit 0
fi

kill "$PID" 2>/dev/null || true

for _ in {1..20}; do
  if ! is_running "$PID"; then
    rm -f "$PID_FILE"
    echo "Stopped (PID: $PID)"
    exit 0
  fi
  sleep 0.2
done

kill -9 "$PID" 2>/dev/null || true
rm -f "$PID_FILE"
echo "Stopped forcefully (PID: $PID)"

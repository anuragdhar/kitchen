#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/react-configurator"
STATE="$ROOT/.devcontainer/.runtime"
mkdir -p "$STATE"
chmod 700 "$STATE"
# Concurrent reconnect/start hooks must not create duplicate servers.
exec 9>"$STATE/start.lock"
flock -w 15 9
cd "$APP"
if [[ ! -f node_modules/vite/bin/vite.js ]]; then
  echo 'Dependencies missing. Run: cd react-configurator && npm ci' >&2
  exit 1
fi
EXPECTED="$(node --input-type=module -e 'import { workspaceId } from "../.devcontainer/vite.config.mjs"; console.log(workspaceId)')"
ready() {
  [[ "$(curl -fsS --max-time 2 http://127.0.0.1:5173/__home_interior_ready 2>/dev/null || true)" == "$EXPECTED" ]]
}
show_preview() {
  echo 'Home Interior is ready at http://localhost:5173'
  echo 'Open the PORTS tab, then Open in Browser for port 5173. Keep visibility Private.'
  echo "Server log: $STATE/preview.log"
}
if ready; then
  show_preview
  exit 0
fi
# Start the exact locked Vite binary. Close the lock FD in the child process.
nohup node "$APP/node_modules/vite/bin/vite.js" --config "$ROOT/.devcontainer/vite.config.mjs" \
  >"$STATE/preview.log" 2>&1 < /dev/null 9>&- &
PID=$!
printf '%s\n' "$PID" > "$STATE/preview.pid"
for _ in {1..60}; do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "Preview failed to start. Check $STATE/preview.log (port 5173 may be occupied)." >&2
    exit 1
  fi
  if ready; then
    show_preview
    exit 0
  fi
  sleep 1
done
# This PID is the child just started here, not a PID loaded from an old file.
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true
echo "Preview did not become ready; check $STATE/preview.log." >&2
exit 1

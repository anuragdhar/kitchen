#!/usr/bin/env bash
# Linux/Codespaces launcher. Start once, verify readiness, then return to the IDE.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/react-configurator"
CONFIG="$ROOT/.devcontainer/vite.config.mjs"
KEY="$(printf '%s' "$ROOT" | sha256sum | cut -c1-12)"
STATE="${TMPDIR:-/tmp}/home-interior-preview-$(id -u)-$KEY"
mkdir -p "$STATE"
chmod 700 "$STATE"
exec 9>"$STATE/start.lock"
flock -w 70 9
cd "$APP"
if [[ ! -f node_modules/vite/bin/vite.js ]]; then
  echo 'Missing dependencies. Run: npm --prefix react-configurator ci (from repository root).' >&2
  exit 1
fi
healthy() {
  curl --noproxy '*' --fail --silent --max-time 2 http://127.0.0.1:5173/ | grep -q '/src/main.jsx'
}
owned_pid() {
  [[ "${1:-}" =~ ^[0-9]+$ ]] && kill -0 "$1" 2>/dev/null &&
    [[ -r "/proc/$1/cmdline" ]] && grep -Fzq -- "$CONFIG" "/proc/$1/cmdline"
}
PID=''
if [[ -f "$STATE/server.pid" ]]; then PID="$(cat "$STATE/server.pid")"; fi
if ! owned_pid "$PID"; then
  # Do not mistake a different app on this port for our own server.
  node --input-type=module -e '
    import net from "node:net";
    const probe = net.createServer();
    probe.once("error", (error) => {
      console.error(`Cannot start preview on port 5173: ${error.code}. No processes were stopped.`);
      process.exitCode = 1;
    });
    probe.listen(5173, "0.0.0.0", () => probe.close());
  '
  nohup node "$APP/node_modules/vite/bin/vite.js" --config "$CONFIG" \
    >"$STATE/server.log" 2>&1 < /dev/null 9>&- &
  PID=$!
  printf '%s\n' "$PID" >"$STATE/server.pid"
fi
for ((attempt=0; attempt<60; attempt++)); do
  if ! owned_pid "$PID"; then
    echo "Preview failed to start. See $STATE/server.log" >&2
    tail -n 30 "$STATE/server.log" >&2
    exit 1
  fi
  if healthy; then
    echo 'Home Interior is ready at http://localhost:5173/ (Codespaces: Ports -> 5173 -> Open in Browser).'
    echo "Preview PID: $PID; log: $STATE/server.log"
    echo 'Keep port visibility Private. Stop the codespace when finished.'
    exit 0
  fi
  sleep 1
done
echo "Preview readiness timed out. See $STATE/server.log; no other processes were stopped." >&2
exit 1

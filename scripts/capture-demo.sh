#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-$(node -e "const net=require('node:net');const s=net.createServer();s.listen(0,'127.0.0.1',()=>{console.log(s.address().port);s.close();});")}"
ROOT="$(mktemp -d)"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  rm -rf "$ROOT"
}
trap cleanup EXIT

npm run build
ln -s "$(pwd)/docs" "$ROOT/citizen-lab-notebook"
npx http-server "$ROOT" -a 127.0.0.1 -p "$PORT" -c-1 >/tmp/citizen-lab-notebook-demo.log 2>&1 &
SERVER_PID="$!"

for _ in {1..40}; do
  if curl -fsS "http://127.0.0.1:${PORT}/citizen-lab-notebook/" >/dev/null; then
    break
  fi
  sleep 0.25
done

npx playwright screenshot \
  --viewport-size=1440,1200 \
  --wait-for-timeout=1500 \
  "http://127.0.0.1:${PORT}/citizen-lab-notebook/" \
  docs/demo.png

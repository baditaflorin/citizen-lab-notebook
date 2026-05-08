#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-$(node -e "const net=require('node:net');const s=net.createServer();s.listen(0,'127.0.0.1',()=>{console.log(s.address().port);s.close();});")}"
ROOT="$(mktemp -d)"
cleanup() {
  rm -rf "$ROOT"
}
trap cleanup EXIT

ln -s "$(pwd)/docs" "$ROOT/citizen-lab-notebook"
echo "Serving http://127.0.0.1:${PORT}/citizen-lab-notebook/"
npx http-server "$ROOT" -a 127.0.0.1 -p "$PORT" -c-1

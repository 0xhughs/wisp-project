#!/bin/sh
# Linux-supplemental Node unit checks. These do not prove macOS voice, Keychain,
# shortcut, windowing, microphone, speakers, or Harness live turns.
# spike/client.mjs needs Node >= 22.19 for zstdDecompressSync (same floor as spike/prepare.mjs).
set -eu
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"
if [ -n "${WISP_NODE:-}" ]; then
  NODE=$WISP_NODE
elif [ -x "$HOME/.local/node-v22.20.0-linux-x64/bin/node" ]; then
  NODE=$HOME/.local/node-v22.20.0-linux-x64/bin/node
else
  NODE=$(command -v node)
fi
ver=$("$NODE" -p "process.versions.node")
"$NODE" -e 'const [M,m]=process.versions.node.split(".").map(Number); if(!(M>22 || (M===22 && m>=19))) process.exit(2)' || {
  echo "Node $ver is below 22.19; install a qualifying runtime (see spike/prepare.mjs)." >&2
  exit 2
}
"$NODE" --test \
  desktop/tests/voice-protocol.test.mjs \
  desktop/tests/voice-seams.test.mjs \
  desktop/tests/body-bridge.test.mjs \
  desktop/tests/permission-protocol.test.mjs \
  desktop/tests/reasoning-config.test.mjs \
  desktop/tests/memory-context.test.mjs \
  desktop/tests/plugin-config.test.mjs \
  desktop/tests/hardware-inspect.test.mjs \
  desktop/tests/ollama-inspect.test.mjs \
  desktop/tests/safe-actions.test.mjs \
  desktop/tests/safe-actions-protocol.test.mjs \
  desktop/tests/ax-actions.test.mjs \
  desktop/tests/ax-actions-protocol.test.mjs \
  desktop/tests/connection-config.test.mjs \
  desktop/tests/pet-config.test.mjs \
  desktop/tests/skill-config.test.mjs
python3 tools/identity.py --self-test --repo "$root"

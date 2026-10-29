#!/usr/bin/env bash
# Public tunnel for local Zendesk testing (localhost.run — no ngrok).
# Keep this terminal open. Free URLs can still change unless you use a custom domain.

set -euo pipefail

PORT="${PORT:-3006}"
IDENTITY="${HOME}/.ssh/id_ed25519"

echo "Tunneling http://127.0.0.1:${PORT} via localhost.run ..."
echo "Keep this terminal open. Copy the https://....lhr.life URL into Zendesk."
echo

SSH_OPTS=(
  -o StrictHostKeyChecking=no
  -o ServerAliveInterval=30
  -o ExitOnForwardFailure=yes
)

if [[ -f "$IDENTITY" ]]; then
  SSH_OPTS+=(-i "$IDENTITY")
fi

# After adding your public key at https://admin.localhost.run/
# authenticated tunnels use: ssh.localhost.run
# Until then, nokey@localhost.run still works for short tunnels.
TARGET="${LOCALHOST_RUN_HOST:-nokey@localhost.run}"

exec ssh "${SSH_OPTS[@]}" -R "80:127.0.0.1:${PORT}" "$TARGET"

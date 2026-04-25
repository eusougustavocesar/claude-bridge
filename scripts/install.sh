#!/usr/bin/env bash
# reverb installer (macOS).
# Generates a LaunchAgent plist from the template and registers it.
#
# Usage: bash scripts/install.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_TEMPLATE="$REPO_DIR/templates/launchagent.plist.template"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

USER_NAME="$(whoami)"
NODE_BIN="$(which node || echo /usr/local/bin/node)"
PLIST_NAME="com.$USER_NAME.reverb.plist"
PLIST_TARGET="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "==> reverb installer"
echo "    REPO_DIR : $REPO_DIR"
echo "    NODE_BIN : $NODE_BIN"
echo "    USER     : $USER_NAME"
echo

# Pre-flight checks
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found on PATH. Install Node 18+ first." >&2
  exit 1
fi

if [ ! -f "$REPO_DIR/dist/bot.js" ]; then
  echo "==> Building (dist/bot.js not found)..."
  (cd "$REPO_DIR" && npm install && npm run build)
fi

if [ ! -f "$REPO_DIR/.env" ]; then
  echo "==> Creating .env from .env.example"
  cp "$REPO_DIR/.env.example" "$REPO_DIR/.env"
  echo "    Edit $REPO_DIR/.env before pairing."
fi

# Render plist from template
mkdir -p "$LAUNCH_AGENTS_DIR"
sed \
  -e "s|{{USER}}|$USER_NAME|g" \
  -e "s|{{NODE_BIN}}|$NODE_BIN|g" \
  -e "s|{{REPO_DIR}}|$REPO_DIR|g" \
  "$PLIST_TEMPLATE" > "$PLIST_TARGET"

echo "==> Plist written to $PLIST_TARGET"
echo
echo "NEXT STEPS:"
echo "  1. Pair your WhatsApp (shows QR code):"
echo "       cd $REPO_DIR && npm run pair"
echo
echo "  2. Scan QR on phone:"
echo "       WhatsApp > Settings > Linked Devices > Link a Device"
echo
echo "  3. Send yourself a test message, then Ctrl+C to stop the pairing session."
echo
echo "  4. Start the LaunchAgent daemon:"
echo "       launchctl bootstrap gui/\$(id -u) $PLIST_TARGET"
echo
echo "  5. Verify:"
echo "       launchctl list | grep reverb"
echo "       tail -f /tmp/reverb.log"

#!/usr/bin/env bash
# reverb installer — macOS (LaunchAgent) and Linux (systemd user service).
#
# Usage: bash scripts/install.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
USER_NAME="$(whoami)"
NODE_BIN="$(which node || echo /usr/local/bin/node)"

echo "==> reverb installer"
echo "    REPO_DIR : $REPO_DIR"
echo "    NODE_BIN : $NODE_BIN"
echo "    USER     : $USER_NAME"
echo

# ── Pre-flight checks ────────────────────────────────────────────────────────

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found on PATH. Install Node 20+ first." >&2
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

# ── macOS ────────────────────────────────────────────────────────────────────

install_macos() {
  local template="$REPO_DIR/templates/launchagent.plist.template"
  local launch_agents_dir="$HOME/Library/LaunchAgents"
  local plist_name="com.$USER_NAME.reverb.plist"
  local plist_target="$launch_agents_dir/$plist_name"

  mkdir -p "$launch_agents_dir"
  sed \
    -e "s|{{USER}}|$USER_NAME|g" \
    -e "s|{{NODE_BIN}}|$NODE_BIN|g" \
    -e "s|{{REPO_DIR}}|$REPO_DIR|g" \
    "$template" > "$plist_target"

  echo "==> LaunchAgent written to $plist_target"
  echo
  echo "NEXT STEPS:"
  echo "  1. Pair your WhatsApp (shows QR code):"
  echo "       cd $REPO_DIR && npm run pair"
  echo
  echo "  2. Scan QR in WhatsApp › Settings › Linked Devices › Link a Device"
  echo
  echo "  3. Start the daemon:"
  echo "       launchctl bootstrap gui/\$(id -u) $plist_target"
  echo
  echo "  4. Verify:"
  echo "       launchctl list | grep reverb"
  echo "       tail -f /tmp/reverb.log"
}

# ── Linux ────────────────────────────────────────────────────────────────────

install_linux() {
  local template="$REPO_DIR/templates/reverb.service.template"
  local systemd_dir="$HOME/.config/systemd/user"
  local service_target="$systemd_dir/reverb.service"

  if ! command -v systemctl >/dev/null 2>&1; then
    echo "ERROR: systemctl not found. Is systemd running?" >&2
    echo "       For non-systemd Linux, run manually: nohup npm run start > /tmp/reverb.log 2>&1 &" >&2
    exit 1
  fi

  mkdir -p "$systemd_dir"
  sed \
    -e "s|{{NODE_BIN}}|$NODE_BIN|g" \
    -e "s|{{REPO_DIR}}|$REPO_DIR|g" \
    -e "s|{{HOME}}|$HOME|g" \
    "$template" > "$service_target"

  systemctl --user daemon-reload
  systemctl --user enable reverb.service

  echo "==> systemd unit written to $service_target"
  echo
  echo "NEXT STEPS:"
  echo "  1. Pair your WhatsApp (shows QR code):"
  echo "       cd $REPO_DIR && npm run pair"
  echo
  echo "  2. Scan QR in WhatsApp › Settings › Linked Devices › Link a Device"
  echo
  echo "  3. Start the daemon:"
  echo "       systemctl --user start reverb"
  echo
  echo "  4. Verify:"
  echo "       systemctl --user status reverb"
  echo "       tail -f /tmp/reverb.log"
  echo
  echo "  TIP: to persist across reboots without re-login:"
  echo "       sudo loginctl enable-linger $USER_NAME"
}

# ── Dispatch ─────────────────────────────────────────────────────────────────

if [[ "$OSTYPE" == "darwin"* ]]; then
  install_macos
else
  install_linux
fi

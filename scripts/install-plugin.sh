#!/usr/bin/env bash
# Install or update the semi-design plugin in Antigravity (~/.gemini/config/plugins/semi-design).
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="${HOME}/.gemini/config/plugins/semi-design"

mkdir -p "$(dirname "$TARGET_DIR")"
rm -rf "$TARGET_DIR"
cp -R "$REPO_DIR/plugin" "$TARGET_DIR"
echo "Installed semi-design plugin to $TARGET_DIR"
echo "Restart Antigravity (or reload window) to activate /semi-init, /semi-audit, /semi-fix, /semi-update, /semi-propose, /semi-triage and the Semi UI rules."

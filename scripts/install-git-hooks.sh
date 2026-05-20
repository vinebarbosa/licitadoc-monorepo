#!/bin/sh
set -eu

HOOK_SOURCE="scripts/git-hooks/pre-push"
HOOK_TARGET=".git/hooks/pre-push"

if [ ! -d ".git" ]; then
  echo "Cannot install Git hooks: .git directory not found."
  exit 1
fi

if [ ! -f "$HOOK_SOURCE" ]; then
  echo "Cannot install Git hooks: $HOOK_SOURCE not found."
  exit 1
fi

mkdir -p ".git/hooks"

if [ -f "$HOOK_TARGET" ] && ! cmp -s "$HOOK_SOURCE" "$HOOK_TARGET"; then
  BACKUP_TARGET="$HOOK_TARGET.backup.$(date +%Y%m%d%H%M%S)"
  cp "$HOOK_TARGET" "$BACKUP_TARGET"
  echo "Existing pre-push hook backed up to $BACKUP_TARGET"
fi

cp "$HOOK_SOURCE" "$HOOK_TARGET"
chmod +x "$HOOK_TARGET"

echo "Installed pre-push hook at $HOOK_TARGET"

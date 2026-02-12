#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash scripts/switch-environment.sh <opencode|antigravity>"
  exit 1
fi

PROFILE="$1"

case "$PROFILE" in
  opencode|antigravity)
    ;;
  *)
    echo "Invalid profile: $PROFILE"
    echo "Expected one of: opencode, antigravity"
    exit 1
    ;;
esac

cat > .dev-environment.local <<EOF
ACTIVE_ENVIRONMENT=$PROFILE
UPDATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo "Active environment set to: $PROFILE"
echo "Written: .dev-environment.local"

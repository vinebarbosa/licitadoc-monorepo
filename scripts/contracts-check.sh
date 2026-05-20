#!/bin/sh
set -eu

CHECK_PATHS="apps/api/openapi packages/api-client/src/gen"

sh ./scripts/contracts-generate.sh

if [ -n "$(git status --porcelain -- $CHECK_PATHS)" ]; then
  echo ""
  echo "Generated API contract artifacts are out of sync."
  echo "Review and commit the generated changes before pushing:"
  echo ""
  git status --short -- $CHECK_PATHS
  echo ""
  echo "Useful commands:"
  echo "  git diff -- apps/api/openapi packages/api-client/src/gen"
  echo "  git add apps/api/openapi packages/api-client/src/gen"
  exit 1
fi

echo "Generated API contract artifacts are in sync."

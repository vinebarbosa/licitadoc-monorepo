#!/bin/sh
set -eu

echo "Generating API OpenAPI document..."
pnpm --filter @licitadoc/api generate:openapi

echo "Generating API client..."
pnpm --filter @licitadoc/api-client generate

echo "API contract artifacts generated."

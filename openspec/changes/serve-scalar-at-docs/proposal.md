## Why

The API currently serves Swagger UI at `/docs`, but the team wants Scalar to be the primary interactive documentation experience at that path. Aligning `/docs` with Scalar improves the developer-facing docs surface without changing the underlying OpenAPI contract at `/openapi.json`.

## What Changes

- Replace the current Swagger UI HTTP surface at `/docs` with a Scalar-based API reference in `apps/api`.
- Keep `/openapi.json` as the canonical exported contract that powers the documentation UI.
- Preserve the merged application and auth OpenAPI document so the new docs surface shows the same API coverage that `/docs` exposes today.
- Update the backend docs wiring and any related dependencies or bootstrapping needed to serve Scalar from Fastify.

## Capabilities

### New Capabilities
- `api-documentation-ui`: The API serves an interactive Scalar documentation UI at `/docs`, backed by the exported and merged OpenAPI document.

### Modified Capabilities

## Impact

- Affected code: `apps/api/src/plugins/openapi.ts` and related API documentation wiring.
- Dependencies: likely replaces or supplements the current Swagger UI package with a Scalar integration package for Fastify.
- APIs: `/docs` changes UI implementation, while `/openapi.json` remains the contract source.
- Systems: backend developers and API consumers get the new Scalar experience at the existing docs URL.

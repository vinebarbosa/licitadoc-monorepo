## Why

The API currently depends on a serverless runtime that is failing to run production behavior reliably, especially around Node runtime packaging and native/transitive dependencies. Dockerizing the API gives Licitadoc a portable deployment target that can run the same build artifact locally and in container-capable hosts.

## What Changes

- Add a production-ready Docker build path for `@licitadoc/api`.
- Package only the files and dependencies needed to run the compiled API in production.
- Keep API configuration runtime-driven through environment variables, including host, port, database, auth, storage, text generation, mail, and realtime settings.
- Provide container health verification through the existing `/health` endpoint.
- Document local container build/run usage and deployment expectations for container platforms.
- Optionally extend local Docker Compose so the API can run against the existing Postgres and MiniStack services.

## Capabilities

### New Capabilities
- `api-container-deployment`: The API can be built, configured, and operated as a production container image.

### Modified Capabilities
- None.

## Impact

- Affected code: root/package build configuration as needed, API package scripts as needed, Docker-related files, deployment documentation, and optional local compose wiring.
- Affected runtime: `@licitadoc/api` production startup via `node dist/app/server.js`, using Node 24-compatible dependencies and existing environment variables.
- Affected systems: database connectivity, S3-compatible storage configuration, auth URL/CORS settings, text generation provider configuration, email provider configuration, and realtime provider configuration.
- No public API route contract changes are expected.

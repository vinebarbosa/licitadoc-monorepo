## Why

`apps/api` already concentrates most of the project's backend behavior, authorization rules, database integration, OpenAPI generation, and automated tests, but it still lacks package-local documentation that explains how to work in that area safely. That slows onboarding and makes human or agent-assisted contributions more likely to drift from the actual architecture.

## What Changes

- Add `apps/api/agents.md` with a practical guide for agents and contributors working on the backend, including commands, workflow expectations, change boundaries, and local conventions.
- Add `apps/api/architecture.md` with an architecture map for the API, covering app bootstrap, plugins, modules, authorization, database layers, OpenAPI generation, and tests.
- Ensure both documents reference real source files and current runtime flows so they act as operational guidance instead of aspirational documentation.
- Optionally improve discoverability from the repository root documentation if that helps future contributors find the new guides quickly.

## Capabilities

### New Capabilities
- `api-maintainer-docs`: Defines the minimum documentation that `apps/api` must expose so agents and maintainers can understand operational workflows, change boundaries, and the current architecture.

### Modified Capabilities

## Impact

- Affected code: `apps/api/agents.md`, `apps/api/architecture.md`, and any optional discovery links in the repository README.
- Systems: backend onboarding, agent-assisted contribution workflows, and API maintenance.
- APIs: no HTTP contract changes are intended; the impact is documentary and operational.

## Why

The web app depends on the generated API client, and in a monorepo the frontend and API usually move together in the same branch. Without a local guard, it is easy to push an API contract change while forgetting to regenerate the OpenAPI document and client package.

## What Changes

- Add a local pre-push guard that regenerates the API OpenAPI document and API client before code is pushed.
- Make the guard fail when generation produces uncommitted changes, prompting the developer to commit the updated generated artifacts.
- Keep this out of CI for now so remote validation and deploys stay fast while the deployment flow is still being shaped.
- Document how to install/run the guard and how to bypass it intentionally when needed.

## Capabilities

### New Capabilities
- `api-client-sync-guard`: Ensures generated OpenAPI and API client artifacts are refreshed before local pushes.

### Modified Capabilities
- None.

## Impact

- Affected code: root package scripts or tooling config, Git hook setup, `apps/api/openapi`, and `packages/api-client`.
- Affected workflow: local pushes run the generation guard before code reaches GitHub/Vercel.
- No API runtime behavior changes and no CI/CD job is added in this change.

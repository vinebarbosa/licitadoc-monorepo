## Context

The validated owner organization workspace currently mirrors the v0 `/organizacao` main content, but the production component still uses local mock data. The backend already exposes organization profile reads/updates, member listing/updating/deletion, invite creation/listing, department create/list/update, and a print letterhead image upload. The validated UI needs a broader persisted surface: scoped invite cancellation/resend, department deletion, and upload state for logo, crest, and paper letterhead template files.

## Goals / Non-Goals

**Goals:**
- Keep the approved workspace layout and visual refinements intact while replacing mock state with API-backed state.
- Use existing generated TanStack Query hooks where contracts already exist.
- Add narrow API endpoints for missing persisted actions used by the screen.
- Persist organization visual assets in object storage behind organization-scoped API URLs.
- Regenerate OpenAPI and the web API client after contract changes.

**Non-Goals:**
- Redesigning the approved UI.
- Introducing granular member roles beyond the current `admin`, `organization_owner`, and `member` backend model.
- Making uploaded logo, crest, or paper template files drive document rendering in this change.
- Reworking the app shell, authorization routing, or onboarding flows.

## Decisions

### Treat the workspace as a composition over existing domain APIs
The React workspace will call organization, users, invites, departments, and organization asset endpoints directly instead of creating a bespoke aggregate endpoint. This keeps backend changes small and reuses existing permission boundaries.

Alternative considered: create one `/api/organizations/me/workspace` endpoint. Rejected for this step because most data already has mature paginated endpoints and separate mutations.

### Preserve the validated UI while adapting domain labels to backend roles
The UI will retain the approved tabs, cards, and sections. Member roles will map the current backend `organization_owner`/`member` roles to display labels instead of inventing local-only `gestor`, `tecnico`, or `visualizador` values.

Alternative considered: add new backend role types for the v0 labels. Rejected because that would change authorization semantics beyond what this screen needs.

### Store organization visual assets as deterministic organization-scoped objects
Logo, crest, and paper template uploads will use deterministic storage keys by organization and asset type. The API will persist URL fields on the organization row and serve the files through scoped same-origin routes.

Alternative considered: store only external URLs in `logoUrl` and keep crest/template local. Rejected because the validated screen has upload zones and should persist user-selected files.

### Add scoped action endpoints for missing workspace operations
Invite revoke/resend and department delete will be added as explicit endpoints with existing role/scope checks. Revoke will mark pending invites as `revoked`; resend will rotate token/expiration and redeliver the invite email.

Alternative considered: emulate these actions in the web app by hiding buttons or using local-only state. Rejected because the implementation should make the validated screen real.

## Risks / Trade-offs

- [API client churn from regenerated contracts] -> Keep route names and schemas narrow, then run focused web/API checks.
- [Paper template upload is stored but not yet consumed by document generation] -> Expose it as an institutional asset only; leave rendering integration for a later change.
- [Resending provisioned-user invites touches temporary credentials] -> Reuse the existing credential replacement helper and preserve pending-profile constraints.
- [Existing dirty worktree contains unrelated changes] -> Touch only files required by this workspace/API implementation and avoid reverting user changes.

## Migration Plan

Add nullable organization columns for `crest_url` and `letterhead_template_url`. Existing organizations remain valid because the fields are optional. Rollback is safe by ignoring the new fields in the app; destructive column removal is not required for application rollback.

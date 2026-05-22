## Why

The `/app/organizacao` workspace now has the validated v0-based UI, but it is still driven by local mock state. Organization owners need the same screen to read and persist real prefeitura data, members, invites, departments, and institutional assets.

## What Changes

- Connect the validated owner organization workspace to persisted organization, user, invite, department, and institutional document APIs.
- Preserve the validated layout and spacing while adding loading, empty, error, optimistic/refresh, and save feedback states for real requests.
- Extend API contracts where the screen has required persisted actions that are not currently exposed: invite revoke/resend, department delete, and organization visual asset uploads for logo, crest, and letterhead template files.
- Regenerate API contracts/client hooks after backend route schema changes.
- Keep the previous mock data only as test fixtures, not as production UI state.

## Capabilities

### New Capabilities
- `owner-organization-workspace-api`: API-backed owner organization workspace for prefeitura profile, members/invites, departments, and institutional assets.

### Modified Capabilities
- `organization-management`: expose and persist organization visual assets required by the workspace.
- `user-invites`: allow scoped invite revoke/resend actions required by the workspace.
- `department-management`: allow scoped department deletion required by the workspace.

## Impact

- Affected web code: `apps/web/src/modules/organizations`, route tests, MSW fixtures/handlers, and any shared organization/departments/user helpers reused by the workspace.
- Affected API code: organization, invite, and department route schemas/services plus storage helpers for organization assets.
- Affected contracts: OpenAPI output and `@licitadoc/api-client` generated hooks/models.
- Affected database: organization asset URL columns for the additional institutional files.

## Why

The validated process creation UI currently blocks organization-scoped users because the responsible field was modeled as a user select and calls `/api/users`, which can be forbidden for that actor. The product decision is that process responsibility is a free-text person/name string, not a relationship to an application user.

## What Changes

- **BREAKING**: Native process create/update/read payloads use `responsibleName` string instead of `responsibleUserId`.
- Remove responsible-user organization validation from process create/update because the responsible is no longer a user foreign key.
- Keep department and organization scoping unchanged.
- Change the authenticated process create page responsible control from API-backed select to text input.
- Stop loading users from the process create page and remove the create-page dependency on user-list permissions.
- Keep document generation using the persisted responsible name.

## Capabilities

### New Capabilities
- `web-process-create-flow`: Authenticated process creation captures the responsible as a typed string in the validated wizard and submits it to the API.

### Modified Capabilities
- `process-management`: Process profile, creation, and update requirements use `responsibleName` as the canonical responsible field instead of `responsibleUserId`.

## Impact

- API process schemas, create/update handlers, shared serializers, OpenAPI, generated API client, and process tests.
- Web process create page, process listing/detail display, model mapping helpers, and tests.
- Existing `processes.responsible_name` storage remains the canonical persisted value; `responsible_user_id` can remain internal/nullable for legacy intake paths if needed, but native process API callers must not depend on it.

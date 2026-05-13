## Context

The canonical process work introduced `responsibleUserId` into native process payloads so the UI rendered responsibility as an API-backed user select. In practice, the process responsible is product data from the procurement process and can be someone who is not a LicitaDoc user. The screenshot also shows an organization-scoped actor receiving `403` from `/api/users`, leaving the required responsible field unusable.

The database already stores `processes.responsible_name` as a non-null process field. `processes.responsible_user_id` can remain nullable for imported/legacy associations, but it should not be part of the native process create/update/read profile.

## Goals / Non-Goals

**Goals:**
- Make `responsibleName` the canonical public process responsible field for native process APIs.
- Remove user lookup and user-organization validation from native process create/update flows.
- Preserve organization and department authorization checks.
- Change the authenticated create page to a text input while keeping the validated demo wizard layout.
- Keep document generation populated from the persisted responsible name.

**Non-Goals:**
- Remove the `responsible_user_id` database column.
- Build autocomplete, invite flow, or user linking from the responsible field.
- Change department responsible fields or user management behavior.

## Decisions

1. Use `responsibleName` in public process DTOs and mutations.

   Rationale: the responsible is procurement process metadata, not an application-user relationship. This matches existing storage and avoids forcing municipalities to create app users for every named responsible.

   Alternative considered: keep `responsibleUserId` and add broader user-list permissions. That still models the wrong product concept and keeps the create page dependent on user-management access.

2. Keep `responsibleUserId` internal and nullable.

   Rationale: existing intake or legacy data can still carry a user association without requiring a destructive migration. Public native process APIs should serialize `responsibleName` and may ignore the nullable internal association.

   Alternative considered: drop the column immediately. That increases migration risk and does not help the immediate front/API mismatch.

3. Use a plain text input in the create wizard.

   Rationale: it preserves the validated UI structure but removes the fragile API-backed select. The field is required and submitted as trimmed `responsibleName`.

   Alternative considered: a combobox with free text and optional user lookup. That adds interaction complexity and keeps `/api/users` in the critical path.

## Risks / Trade-offs

- Existing generated client types may still expose `responsibleUserId` until OpenAPI/client generation runs → regenerate the API client after API schema updates.
- Some tests and fixtures currently assert `responsibleUserId` → update tests to assert `responsibleName`.
- Imported process intake may still resolve a responsible user internally → keep persisted `responsibleName` as the display/document source and do not expose the internal id in native profiles.

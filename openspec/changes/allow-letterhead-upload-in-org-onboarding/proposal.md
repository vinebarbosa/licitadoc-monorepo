## Why

Organization owners currently complete prefeitura onboarding with institutional data, but must configure the official letterhead later in a separate management flow. Allowing the paper letterhead to be uploaded during onboarding removes a setup gap before the first generated documents are printed.

## What Changes

- Add an optional letterhead upload step/field to organization onboarding for invited organization owners.
- When a valid letterhead image is submitted during organization creation, store it through the existing organization letterhead upload/storage flow and associate it with the newly created organization.
- Keep organization onboarding valid without a letterhead so teams can finish setup even when the asset is not available.
- Reuse the same validation rules, authorization boundaries, and response shape as organization-level letterhead management.

## Capabilities

### New Capabilities

- `web-owner-onboarding-letterhead-upload`: Owner organization onboarding exposes an optional letterhead upload experience.

### Modified Capabilities

- `organization-management`: Organization onboarding may attach an optional active print letterhead while creating and linking the prefeitura.

## Impact

- Affected API: organization onboarding route/schema/handler and OpenAPI contract for optional multipart letterhead upload.
- Affected storage: existing organization letterhead object storage path is invoked after organization creation succeeds.
- Affected web UI: owner onboarding form gains a letterhead file control, preview/removal state, validation feedback, and submit behavior.
- Affected generated client/tests: API client regeneration plus backend and frontend coverage for onboarding with and without letterhead.

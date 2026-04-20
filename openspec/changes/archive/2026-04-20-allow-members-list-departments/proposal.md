## Why

The current department listing rule blocks `member` users entirely, which does not match the intended organization visibility model. This needs to be corrected now so members can discover the departments that belong to their own organization without gaining administrative powers.

## What Changes

- Allow authenticated `member` actors to list departments that belong to their own `organizationId`.
- Keep `admin` access to list departments across organizations unchanged.
- Keep `organization_owner` access to list departments from the owned organization unchanged.
- Continue rejecting department creation and update actions from `member` users.
- Preserve the empty paginated response behavior when a non-admin actor has no organization scope.

## Capabilities

### New Capabilities

### Modified Capabilities
- `department-management`: Expand department listing visibility so `member` actors can read the department directory for their own organization.

## Impact

- Affected code: `/Users/vine/Documents/licitadoc/apps/api/src/modules/departments/departments.policies.ts`, `/Users/vine/Documents/licitadoc/apps/api/src/modules/departments/get-departments.ts`, and department route tests.
- APIs: `GET /departments` changes authorization behavior for authenticated `member` users.
- Dependencies: This change builds on the existing department management module and its organization-scoped visibility helpers.

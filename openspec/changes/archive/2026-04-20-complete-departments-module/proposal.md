## Why

The project already models `departments` in the database, but the module is not finished and does not yet reflect the real prefeitura structure you described. This change is needed now to make secretarias manageable inside the admin area with the right data model and role-based permissions.

## What Changes

- Complete the `departments` module as persisted department management for prefeitura organizations.
- Expand the `departments` data model to store `name`, `slug`, `organizationId`, `responsibleName`, `responsibleRole`, `createdAt`, and `updatedAt`.
- Add administrative routes to create, list, read, and update departments with scope rules for `admin` and `organization_owner`.
- Reject department management actions from `member` users.
- Keep `slug` as part of the public department contract and enforce it inside the organization scope.
- Keep department deletion out of scope for this change.

## Capabilities

### New Capabilities
- `department-management`: Covers the persisted data model, administrative routes, and access control for prefeitura departments.

### Modified Capabilities

## Impact

- Affected code: `/Users/vine/Documents/licitadoc/apps/api/src/db/schema/departments.ts`, department migrations, a new `/Users/vine/Documents/licitadoc/apps/api/src/modules/departments` module, route registration, OpenAPI, and `packages/api-client`.
- APIs: New department management endpoints for create/list/detail/update.
- Data model: `departments` will change shape to match the requested prefeitura department model by keeping `slug` and adding the new responsible authority fields.
- Dependencies: Reuses the existing Fastify, Drizzle, Zod, and API client generation stack.

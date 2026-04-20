## Why

The API already has a `processes` table, placeholder routes, and a `documents` table that depends on `processId`, but the module still does not represent the real procurement process data used by the product. This change is needed now to make processes the central parent entity for documents and administrative workflow inside each prefeitura organization.

## What Changes

- Complete the `processes` module as persisted process management for prefeitura organizations.
- Expand the `processes` data model beyond `title` and `status` to store `type`, `processNumber`, nullable `externalId`, `issuedAt`, `object`, `justification`, `responsibleName`, `organizationId`, `createdAt`, and `updatedAt`.
- Preserve the existing technical UUID `id` as the primary key, keep `status` as a lifecycle field, and treat `processNumber` as the business-facing local process number.
- Treat `externalId` as the optional process number or identifier coming from another system.
- Keep the existing `process_departments` relation to associate one or more departments to each process instead of replacing it with a single inline department field.
- Preserve and formalize the one-to-many relation in which one process can have many related documents and each document belongs to exactly one process through `documents.processId`.
- Add management routes to create, list, read, and update processes with organization-scoped access rules and real persisted responses.
- Keep process deletion and nested document management inside process responses out of scope for this change.

## Capabilities

### New Capabilities
- `process-management`: Covers the persisted process data model, organization-scoped CRUD routes, department associations, and the one-to-many ownership relation between processes and documents.

### Modified Capabilities

## Impact

- Affected code: `/Users/vine/Documents/licitadoc/apps/api/src/db/schema/processes.ts`, related migrations, `/Users/vine/Documents/licitadoc/apps/api/src/modules/processes`, route registration, OpenAPI output, and `packages/api-client`.
- Related compatibility surface: `/Users/vine/Documents/licitadoc/apps/api/src/db/schema/documents.ts` and the `documents` module because documents already depend on `processId`.
- APIs: New real management endpoints for process create/list/detail/update, replacing the current placeholder behavior.
- Data model: `processes` will change shape to support the requested business fields while preserving `id`, `organizationId`, `status`, the existing document ownership relation, and `process_departments`.
- Dependencies: Reuses the existing Fastify, Drizzle, Zod, OpenAPI, and generated API client stack.

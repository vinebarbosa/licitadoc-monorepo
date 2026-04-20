## Context

The codebase already contains a `processes` table, a `process_departments` join table, document records that reference `processId`, and placeholder Fastify routes in `/apps/api/src/modules/processes`. Today the persisted model only stores `id`, `organizationId`, `title`, `status`, `createdAt`, and `updatedAt`, which is too small for the procurement process record the product needs to operate with.

The requested domain now has a clearer shape: a process needs its own local process number, an optional identifier from another system (`externalId`), issue date, object, justification, responsible person, and departmental ownership. At the same time, documents already belong to a single process through `documents.processId`, so this change must complete the module without breaking that one-to-many relation.

## Goals / Non-Goals

**Goals:**
- Align the persisted `processes` model with the requested procurement process profile.
- Preserve the existing technical `id` and the current downstream relation in which one process can own many documents.
- Implement create, list, detail, and update routes for processes.
- Enforce actor scope so `admin` can manage any organization and `organization_owner` and `member` stay inside their own organization.
- Keep department associations consistent with organization scope.

**Non-Goals:**
- Process deletion.
- Changing the ownership model of `documents`.
- Returning nested document payloads by default inside process responses.
- Defining a hard enum taxonomy for every future procurement process type.

## Decisions

### Decision: Keep UUID `id` as the technical key and `processNumber` as the local business identifier
The current schema already uses `id` as the stable primary key, and `documents` depends on that foreign key. The module should keep `id` for internal identity and add a distinct `processNumber` field for the local human-facing process number. `processNumber` should be unique inside each organization, not globally.

Alternatives considered:
- Reuse `id` as the displayed process number.
  Rejected because UUIDs do not match the business concept of "número do processo".
- Make `processNumber` the primary key.
  Rejected because it would complicate foreign-key compatibility and future renumbering rules.

### Decision: Model `externalId` as optional metadata from another system
`externalId` represents the process number or identifier that exists in another system. It should be stored as nullable metadata because some processes may have no external reference, and it should not replace either the local primary key or the local `processNumber`.

Alternatives considered:
- Merge `externalId` and `processNumber` into one field.
  Rejected because the user explicitly distinguished the local process number from the number in another system.
- Require `externalId` for every process.
  Rejected because external integration may not exist for all records.

### Decision: Replace `title` with procurement-specific fields and keep `status`
The placeholder `title` field is too generic for the workflow described in `DFD_Final.md`. The table should evolve to store `type`, `processNumber`, `externalId`, `issuedAt`, `object`, `justification`, and `responsibleName`, while keeping `status` as the lifecycle field already present in the schema.

Alternatives considered:
- Keep `title` and map it to `object` only at the HTTP layer.
  Rejected because it would leave the database model semantically mismatched with the domain language.
- Remove `status`.
  Rejected because the current schema already models lifecycle state and remains useful for drafts and later workflow phases.

### Decision: Store `responsibleName` on the process even when it usually comes from the department
The requester noted that the responsible party is usually the department responsible. Even so, the process should persist its own `responsibleName` value instead of deriving it on every read from the current department record. This keeps the process historically stable if the department leadership changes later.

Alternatives considered:
- Derive the responsible person only from the linked department at read time.
  Rejected because it would make historical process records drift when department data changes.

### Decision: Keep department linkage in `process_departments` and expose it as `departmentIds`
Although many processes will likely have one main department, the database already models process-to-department linkage through `process_departments`. The module should keep that relation, require at least one linked department on create, and expose it through a flat `departmentIds` array in the process contract.

Alternatives considered:
- Replace the join table with a single `departmentId` column on `processes`.
  Rejected because it discards existing flexibility and creates unnecessary schema churn.
- Return fully nested department objects in every process response.
  Rejected for now to keep the contract simpler and avoid coupling process reads to richer join serialization before it is needed.

### Decision: Preserve document ownership through `documents.processId` instead of duplicating document references on `processes`
The project already models documents as child records that belong to one process through `documents.processId`. The process module should preserve this one-to-many relation and not introduce a `documentIds` array or duplicate ownership data on the `processes` table. Full nested document management can remain in the documents module for now.

Alternatives considered:
- Store document ids directly on `processes`.
  Rejected because ownership is already correctly normalized in `documents`.
- Embed the full document list in every process response.
  Rejected for this change because it broadens the contract and mixes responsibilities between modules.

### Decision: Use transactional writes for process rows and department links
Creating or updating a process touches both the `processes` table and `process_departments`. The implementation should wrap those mutations in a transaction so the process record and its department associations stay in sync.

Alternatives considered:
- Insert the process first and reconcile departments in separate statements without a transaction.
  Rejected because partial failures could leave incomplete process assignments.

### Decision: Use paginated list responses aligned with the admin API pattern
The process listing should follow the same shape already used by organizations and departments: `items`, `page`, `pageSize`, `total`, and `totalPages`.

Alternatives considered:
- Keep a plain `{ items: [] }` response only for processes.
  Rejected because it would create another management pattern for a similar administrative module.

## Risks / Trade-offs

- [Existing process rows only contain `title`] -> Backfill or phase the migration so new required business fields can be introduced without breaking existing rows.
- [Cross-organization department ids could be attached to a process] -> Validate every linked department against the resolved process organization before insert or update.
- [Duplicate process numbers inside one organization] -> Enforce an organization-scoped unique constraint and convert database violations into conflict responses.
- [Changing the process schema can affect document workflows] -> Preserve `id`, avoid destructive table recreation, and keep `documents.processId` untouched.
- [Stored `responsibleName` can diverge from the current department responsible] -> Accept the snapshot behavior as intentional historical data.

## Migration Plan

Update the `processes` table in place so the primary key remains stable. Add the new business columns, preserve `status`, `organizationId`, and `id`, and keep `externalId` nullable. If existing rows are present, migrate legacy `title` data into `object` and use a controlled backfill strategy for any newly required fields before enforcing final constraints. Keep `process_departments` as the association table and leave `documents.processId` unchanged so existing related documents remain attached to the same process ids.

After the schema change, implement the HTTP module, regenerate OpenAPI and the generated API client, and validate the affected packages.

## Open Questions

No open questions at this time. This design assumes process responses expose process fields and department links, while related documents continue to be managed through the documents module.

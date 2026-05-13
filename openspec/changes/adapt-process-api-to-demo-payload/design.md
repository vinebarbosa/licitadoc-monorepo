## Context

The current process API was shaped around imported expense-request intake. Native process creation still accepts `type`, `responsibleName`, `sourceKind`, `sourceReference`, and open-ended `sourceMetadata`, while the demo/front now models a native English payload with `procurementMethod`, `biddingModality`, `responsibleUserId`, `departmentIds`, and structured `items`.

The API already has the right ownership backbone: processes are organization-scoped, departments are linked through `process_departments`, and documents point to their parent process through `documents.processId`. The change should simplify process data without disturbing that process-to-documents relationship.

## Goals / Non-Goals

**Goals:**

- Make the native process create/update API accept the front-aligned English process payload.
- Remove unnecessary native process fields and generic source metadata from the process profile.
- Persist simple items, kit items, and kit components as canonical process data.
- Validate responsible users, organizations, departments, and item structure on the API side.
- Preserve document ownership through the existing `documents.processId` relationship.
- Keep SD/PDF intake usable by mapping extracted data into the new canonical process model.
- Make generated document prompts read canonical process fields/items rather than legacy source metadata.

**Non-Goals:**

- Redesign the document table or document generation lifecycle.
- Change authentication, organization, or department ownership rules.
- Trust front-provided derived summary fields such as estimated totals or item counts.
- Preserve arbitrary legacy metadata as part of the public process profile.

## Decisions

### Use an English canonical process contract

Native process creation and updates will use English field names that match the front payload:

- `procurementMethod`
- `biddingModality`
- `processNumber`
- `externalId`
- `issuedAt`
- `responsibleUserId`
- `title`
- `object`
- `justification`
- `organizationId`
- `departmentIds`
- `items`

`procurementMethod` and `biddingModality` are nullable/optional because the demo flow treats them as optional. `status` remains API-owned and defaults to `draft`.

Alternative considered: keep `type` as the canonical database field and translate at the API edge. That would keep legacy code smaller but preserve a confusing domain name that no longer matches the product model.

### Store responsible as a user reference

The API will accept `responsibleUserId`, validate it against the resolved process organization, and persist it as the responsible reference. It will no longer require callers to submit `responsibleName`.

Alternative considered: continue storing only `responsibleName`. That avoids a user lookup but makes the front send duplicate data it already has as a selected user id.

### Promote items to first-class process data

Process items and kit components will move out of `sourceMetadata` into structured persistence. A process can have zero or more items. Each item has a stable stored id, `kind`, `code`, `title`, optional simple-item `description`, `quantity`, `unit`, `unitValue`, `totalValue`, and position. Kit items have components with their own `title`, `description`, `quantity`, `unit`, and position. Kit items do not need item-level descriptions.

Alternative considered: keep items in `sourceMetadata.extractedFields.items`. That is flexible but makes validation, OpenAPI, document generation, and future item editing all depend on untyped metadata.

### Keep documents linked to processes unchanged

The document schema and ownership model remain intact. Documents continue to reference the parent process by `documents.processId`; process profile and item migrations must not rewrite document ids or detach existing documents.

Alternative considered: introduce a new process-document join model. That is unnecessary because each generated/managed document still belongs to exactly one process.

### Treat summary values as computed response data

The API may return computed values such as `itemCount`, `componentCount`, `estimatedTotalValue`, and document progress, but it must compute them from stored items/documents. If a front payload includes a `summary` object, the API should either ignore it during a compatibility window or reject it once the generated client is aligned; it must not persist or trust it.

Alternative considered: persist the submitted summary. That risks stale totals whenever items change.

### Map SD/PDF intake into the canonical model

The existing SD/PDF endpoints can remain, but their extracted context should be transformed into the same canonical process creation path. Extracted item data becomes structured process items; missing native-only fields stay null when optional. The public process response should no longer expose raw source metadata.

Alternative considered: keep a separate SD-backed process path with legacy fields. That would leave two process models alive and keep document generation branching around `sourceMetadata`.

## Risks / Trade-offs

- Breaking API/client contract -> regenerate `@licitadoc/api-client`, update web callers, and cover the new payload with API tests.
- Existing rows contain legacy fields and metadata -> add a migration that maps `type` to `procurementMethod`/`biddingModality` where possible, extracts structured items from known `sourceMetadata.extractedFields.items`, and leaves unknown metadata behind instead of exposing it.
- Responsible users may be deleted later -> choose a foreign-key behavior deliberately during implementation and cover the read/generation fallback in tests.
- Monetary precision can drift if JavaScript numbers are stored directly -> use database decimal/numeric storage or normalized decimal strings for quantities and values.
- SD/PDF extraction may not map cleanly to every canonical enum -> allow nullable optional procurement fields and preserve validation warnings internally where needed.

## Migration Plan

1. Add new process columns for `procurement_method`, `bidding_modality`, and `responsible_user_id`.
2. Add structured item/component tables or equivalent relational storage with process foreign keys and ordered positions.
3. Backfill canonical fields from existing `type`, `responsibleName` where possible, and known `sourceMetadata.extractedFields.items`.
4. Keep `documents.process_id` untouched.
5. Update API schemas and create/update handlers to write canonical fields/items.
6. Update reads, listings, estimated totals, and document generation context to read canonical data.
7. Remove old public fields from process responses after callers are migrated.

Rollback should keep old columns until the new contract is verified in staging. If rollback is needed, disable the new create/update schema and continue serving existing rows from the old process columns.

## Open Questions

- Should the API temporarily accept and ignore `summary` for compatibility, or should the generated client omit it immediately?
- Should `responsibleUserId` be nullable after user deletion, or should user deletion be restricted while processes reference that user?
- What exact enum values should be finalized for `procurementMethod` and `biddingModality` beyond the demo values `bidding` and `reverse_auction`?

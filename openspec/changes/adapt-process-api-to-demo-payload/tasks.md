## 1. Data Model and Migration

- [x] 1.1 Add canonical process fields for `procurementMethod`, `biddingModality`, and `responsibleUserId` to the API database schema.
- [x] 1.2 Add structured process item and process item component persistence with process/item foreign keys, ordered positions, quantities, units, and monetary values.
- [x] 1.3 Create a database migration that adds the new fields/tables while preserving existing `documents.processId` links.
- [x] 1.4 Backfill known legacy process data from `type`, `responsibleName`, and recognized `sourceMetadata.extractedFields.items` into canonical fields/items where possible.
- [x] 1.5 Decide and implement the foreign-key behavior for `responsibleUserId` when users are deleted or detached from organizations.

## 2. API Schemas and Serialization

- [x] 2.1 Replace the native create-process schema with the English payload fields from the demo/front contract.
- [x] 2.2 Add discriminated item schemas for `simple` and `kit`, ensuring kit items do not require item-level `description` and kit components keep their own descriptions.
- [x] 2.3 Update the update-process schema to accept canonical fields, department ids, and structured items.
- [x] 2.4 Remove public native process response fields for `type`, `responsibleName`, `sourceKind`, `sourceReference`, and `sourceMetadata`.
- [x] 2.5 Add API-computed summary fields for item count, component count, and estimated total value where process detail/list responses need them.

## 3. Process Create and Update Logic

- [x] 3.1 Update `createProcess` to resolve organization scope, validate departments, validate `responsibleUserId`, and persist canonical process fields.
- [x] 3.2 Persist submitted simple items, kit items, and kit components transactionally during process creation.
- [x] 3.3 Update `updateProcess` to validate canonical changes and replace department links/items only when those fields are submitted.
- [x] 3.4 Keep process-number uniqueness and cross-organization validation behavior intact.
- [x] 3.5 Ensure process updates do not alter or detach existing documents linked through `documents.processId`.

## 4. Reads, Listings, and Documents

- [x] 4.1 Update process serialization to return canonical fields, structured items, department ids, timestamps, and computed summaries.
- [x] 4.2 Update process detail reads to include document cards while reading item data from canonical item storage.
- [x] 4.3 Update process listings and filters to use `procurementMethod`/`biddingModality` where the API previously exposed or filtered by `type`.
- [x] 4.4 Update estimated-value calculation to derive from structured process item totals instead of `sourceMetadata`.
- [x] 4.5 Verify document list/detail/generation routes still rely on the existing process id relationship.

## 5. SD/PDF Intake and Generation Context

- [x] 5.1 Map SD text intake output into canonical process create input and structured items.
- [x] 5.2 Map SD PDF intake output into canonical process create input and structured items.
- [x] 5.3 Stop returning raw SD text or generic source metadata in process responses.
- [x] 5.4 Update document generation prompt assembly to read canonical process fields, departments, responsible user data, and structured items.
- [ ] 5.5 Update document generation recipe tests that currently assert source-metadata item behavior.

## 6. Tests, Client, and Verification

- [ ] 6.1 Update process unit tests for canonical create/update payloads, responsible-user validation, department scope, and duplicate process numbers.
- [ ] 6.2 Add tests for simple item persistence, kit item persistence without description, and kit component descriptions.
- [ ] 6.3 Add or update e2e coverage for native process creation using the demo-aligned English payload.
- [x] 6.4 Regenerate OpenAPI output and `@licitadoc/api-client` types.
- [ ] 6.5 Run API migrations and the relevant API/e2e test suites.
- [ ] 6.6 Update web integration code to submit the canonical API payload and omit derived summary data from create requests.

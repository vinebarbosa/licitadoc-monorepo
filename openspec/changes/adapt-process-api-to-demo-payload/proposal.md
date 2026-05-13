## Why

The process creation API still reflects an older intake-oriented shape (`type`, `responsibleName`, `sourceKind`, `sourceReference`, `sourceMetadata`) while the demo/front now models a native process creation payload in English with procurement method, bidding modality, responsible user, departments, and structured items. This change aligns the API and persistence model with that front contract, removes fields that are not necessary for native creation, and keeps documents explicitly linked to the process.

## What Changes

- **BREAKING**: Replace the native `POST /api/processes` request contract with an English front-aligned payload:
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
- **BREAKING**: Remove native create/update dependence on `type`, `responsibleName`, `sourceKind`, `sourceReference`, and generic `sourceMetadata`.
- Store process items as first-class structured process data instead of hiding them inside `sourceMetadata`.
- Support both simple items and kit items:
  - Simple items may have `description`.
  - Kit items do not need `description`.
  - Kit components may have their own `description`.
- Resolve `responsibleUserId` against persisted users and ensure the responsible user belongs to the target organization unless the actor is an admin.
- Continue to resolve and validate process organization and department links through persisted organizations/departments.
- Preserve the existing one-to-many document relationship: documents remain linked to processes through `documents.processId`.
- Treat derived values such as item count, component count, estimated total value, and document progress as API-computed response data, not trusted create input.
- Update OpenAPI schemas, API client generation, and process tests to match the new native process contract.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `process-management`: change native process profile, creation, update, item persistence, and document-link preservation requirements to match the English front payload.
- `expense-request-process-intake`: keep SD/PDF intake compatible with the new canonical process model by mapping extracted SD context into the new process fields and structured items.
- `document-generation`: require document generation to read procurement context from canonical process fields and structured process items instead of generic source metadata.

## Impact

- API request/response schemas in `apps/api/src/modules/processes/processes.schemas.ts`.
- Process creation/update logic in `apps/api/src/modules/processes/create-process.ts` and `apps/api/src/modules/processes/update-process.ts`.
- Process serialization, list/detail aggregation, estimated value calculation, and document cards in `apps/api/src/modules/processes/processes.shared.ts`, `get-process.ts`, and `get-processes.ts`.
- Database schema and migration for process profile fields and structured process items/components in `apps/api/src/db/schema/processes.ts`.
- Existing document schema remains linked to processes through `documents.processId`.
- SD/PDF process intake code must map extracted legacy context into the new canonical process model.
- Document generation recipes and prompt assembly must consume canonical process fields/items while preserving generated document behavior.
- API tests, e2e tests, OpenAPI export, and generated `@licitadoc/api-client` types must be updated.

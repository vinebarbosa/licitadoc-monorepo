## 1. Data Model

- [x] 1.1 Add nullable `budgetUnitCode` support to the departments schema and migration.
- [x] 1.2 Add nullable `sourceKind`, `sourceReference`, and `sourceMetadata` support to the processes schema and migration.
- [x] 1.3 Update department and process serializers, schemas, and OpenAPI examples for the new nullable fields.

## 2. Expense Request Parsing

- [x] 2.1 Add an SD text parser that extracts CNPJ, budget unit code/name, request number, issue date, process type, object/classification, justification, item details, values, and responsible signer.
- [x] 2.2 Normalize extracted SD values into a typed process-intake context with warnings for missing optional fields.
- [x] 2.3 Add parser unit tests using the Pureza/Top Down SD text shape and failure cases for missing required fields.

## 3. Scoped Relationship Resolution

- [x] 3.1 Implement organization resolution for SD intake using actor scope, optional admin `organizationId`, and SD CNPJ validation.
- [x] 3.2 Implement department resolution inside the resolved organization using `budgetUnitCode`, unambiguous name fallback, and explicit `departmentIds` override.
- [x] 3.3 Reuse the existing same-organization department validation before process insert.
- [x] 3.4 Add tests for CNPJ mismatch, admin CNPJ resolution, missing department match, ambiguous department match, and cross-organization department ids.

## 4. Process Creation Flow

- [x] 4.1 Add a dedicated SD-backed process creation route and request schema.
- [x] 4.2 Map normalized SD values into process fields, including derived `processNumber`, `externalId`, `issuedAt`, `object`, `justification`, `responsibleName`, and source metadata.
- [x] 4.3 Create the process and department links transactionally using existing conflict handling.
- [x] 4.4 Ensure created process responses include structured source metadata without returning raw SD text.

## 5. Coverage and Contracts

- [x] 5.1 Extend process module unit tests for successful SD-backed creation and validation failures.
- [x] 5.2 Extend process E2E coverage for organization-scoped and admin SD-backed creation flows.
- [x] 5.3 Extend department tests for create/update/read behavior with `budgetUnitCode`.
- [x] 5.4 Regenerate OpenAPI, Postman, and API client artifacts after route/schema changes.
- [x] 5.5 Run API typecheck, lint, unit tests, E2E tests for processes/departments, and OpenSpec status checks.

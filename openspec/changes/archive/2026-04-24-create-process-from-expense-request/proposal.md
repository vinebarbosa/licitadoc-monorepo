## Why

Solicitações de Despesa already contain most of the data needed to open a procurement process, but users currently need to retype that information and manually attach the process to the correct prefeitura and department. Creating a process from SD input will reduce rework and make generated downstream documents start from the same authoritative source.

## What Changes

- Add an SD intake flow that accepts Solicitação de Despesa text input and extracts the fields needed to create a process.
- Resolve the target prefeitura from the authenticated actor scope and/or SD CNPJ, and reject attempts to create processes outside the actor's allowed organization scope.
- Resolve at least one department from the SD's unidade orçamentária within the target prefeitura, with a fallback for explicitly supplied department ids when automatic matching is ambiguous.
- Add optional budget-unit metadata to departments so SD unidade orçamentária codes such as `06.001` can map reliably to stored department records.
- Add optional source metadata to process records so processes created from SD retain the original source kind/reference and extracted SD fields needed by later document generation.
- Create the process using extracted values for process type, request number/reference, issue date, object/classification, justification, responsible signer, and linked departments.

## Capabilities

### New Capabilities

- `expense-request-process-intake`: Covers parsing Solicitação de Despesa input, resolving scoped organization/department relationships, and creating a process from the extracted SD context.

### Modified Capabilities

- `process-management`: Process creation and reads must support SD-derived creation and source metadata while preserving organization scope and department-link requirements.
- `department-management`: Departments must support optional budget-unit codes so SD unidade orçamentária values can be matched inside an organization.

## Impact

- Affected API modules: `apps/api/src/modules/processes`, `apps/api/src/modules/departments`, shared parsing utilities, route schemas, OpenAPI examples, and tests.
- Affected data model: departments may need a nullable `budgetUnitCode`; processes may need nullable `sourceKind`, `sourceReference`, and JSON source metadata.
- Affected relationships: process creation from SD must query organizations/departments through the database and enforce actor scope before insert.
- Affected generated client/contracts: process and department schemas will need regeneration after API contract changes.

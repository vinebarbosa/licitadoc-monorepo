## Context

The API already has scoped organization, department, and process modules. Process creation currently requires explicit structured fields plus at least one `departmentId`; the service resolves the organization from the actor, verifies that the organization exists, verifies that every submitted department belongs to that organization, and then inserts the process and `process_departments` links in a transaction.

The SD example contains the missing upstream source for this workflow: prefeitura CNPJ/name, unidade orçamentária code/name, request number, issue date, process type, classification/object, justification text, item description, quantity/unit/value, total value, and responsible signer. The intake should use that source to create the process and preserve enough extracted metadata for later document generation.

## Goals / Non-Goals

**Goals:**

- Add a JSON API flow that creates a process from extracted SD text.
- Resolve organization and department relationships by querying the database inside the actor's visibility/management scope.
- Add optional department `budgetUnitCode` so SD unidade orçamentária codes can match departments reliably.
- Add optional process source fields so SD-created processes keep source traceability and extracted procurement context.
- Preserve the existing direct structured process creation flow.
- Keep process creation transactional: process row and department links succeed or fail together.

**Non-Goals:**

- Direct binary PDF upload/parsing in this change; clients can submit extracted SD text.
- Automatic creation of organizations or departments from SD data.
- Legal validation of SD content or automatic approval of the resulting process.
- Generating DFD/ETP/TR/minuta in this change.
- Replacing the current process authorization model.

## Decisions

### Decision: Add a dedicated SD-based process creation route

Add a route such as `POST /api/processes/from-expense-request` rather than overloading the existing create body with a union. The body should include:

- `expenseRequestText`
- optional `organizationId` for admin actors
- optional `departmentIds` override/fallback
- optional source metadata such as `fileName` or `sourceLabel`

The route delegates to the same core process creation transaction after extraction and relationship resolution.

Alternatives considered:

- Overload `POST /api/processes/` with a `source` union.
  Rejected because the current direct creation schema is simple and already stable; a dedicated route keeps validation errors and OpenAPI examples clearer.
- Create an intermediate "expense request" resource first.
  Deferred because the immediate product workflow is process creation, not managing SD records independently.

### Decision: Parse SD text deterministically before database writes

Add an expense-request parser/helper that extracts known labels from the Top Down-style SD text and returns a normalized context. The parser should produce values and warnings, not guesses. Expected normalized fields include:

- prefeitura CNPJ/name/address when present
- budget unit code/name
- request number and issue date
- process type
- classification/object summary
- justification
- item description, quantity, unit, unit value, total value, item code when present
- responsible signer name and role

Required values for process creation are request number, issue date, process type, object/classification, justification, and at least enough budget-unit or override data to resolve a department.

Alternatives considered:

- Use text generation to parse the SD.
  Rejected because this is a business import path and needs deterministic tests.
- Require users to manually confirm every extracted field before creation.
  Deferred to a future review UI; the first API should reject ambiguous required relationships and accept explicit overrides.

### Decision: Resolve organization scope before department resolution

For `organization_owner` and `member` actors, the target organization is always `actor.organizationId`. If the SD CNPJ is present and conflicts with the actor organization CNPJ, reject the request. For `admin`, require `organizationId` or resolve by SD CNPJ only when it uniquely matches an existing organization.

After organization resolution, search departments only within that organization. Prefer matching SD budget unit code against `departments.budgetUnitCode`; fall back to normalized department name/slug matching only when the result is unambiguous. If supplied `departmentIds` are present, validate all of them with the existing same-organization department check and use them as an override/fallback.

Alternatives considered:

- Trust department names from the SD without database lookup.
  Rejected because processes must link to persisted departments.
- Allow cross-organization department ids when an admin submits them.
  Rejected because process department links must remain inside the process organization for all actors.

### Decision: Add optional matching/source metadata to existing tables

Add `departments.budgetUnitCode` as nullable text with a unique index per organization when present. This gives the SD's `06.001`-style code a stable database target while keeping existing departments valid.

Add nullable process source fields:

- `sourceKind`, using `expense_request` for SD-created processes
- `sourceReference`, such as `SD 6/2026`
- `sourceMetadata` JSONB with extracted non-raw SD fields, source metadata, and warnings

Do not store or return raw SD text as part of the process response. The JSON metadata should be sanitized to avoid retaining unnecessary personal identifiers from the SD, such as CPF, unless a later legal/audit requirement explicitly needs them.

Alternatives considered:

- Store everything in `externalId`.
  Rejected because one string cannot preserve budget-unit, item, and warning context needed by later document generation.
- Store the raw SD PDF/text in the process.
  Rejected because this change only needs traceability and structured generation context.

### Decision: Map SD values into the existing process profile conservatively

Use the SD request number and issue date to derive process identity fields. A practical first mapping is:

- `processNumber`: generated from SD request number plus issue year, for example `SD-6-2026`, unless an explicit override is later added
- `externalId`: original SD request number
- `type`: SD process type, such as `Serviço`
- `issuedAt`: SD issue date
- `object`: SD classification/object summary
- `justification`: SD justification body
- `responsibleName`: signer/responsible extracted from the SD or department responsible fallback
- `status`: existing default draft status

The service should still use existing process conflict handling for duplicate process numbers in the same organization.

Alternatives considered:

- Use the SD number alone as `processNumber`.
  Rejected because request numbers can repeat across years.
- Require user-supplied process number.
  Rejected because the SD should be enough to create the first draft process.

## Risks / Trade-offs

- [SD text extraction can vary by PDF layout or finance system] -> Keep the parser isolated, covered by fixtures, and strict about warnings instead of guessing.
- [Department matching by name can be brittle] -> Prefer `budgetUnitCode`, add it to departments, and reject ambiguous matches.
- [Admin CNPJ-based organization resolution can be ambiguous if data is dirty] -> Use the existing unique CNPJ constraint and still allow explicit `organizationId`.
- [Source metadata can grow or contain sensitive values] -> Store a curated JSON shape and avoid raw text/CPF by default.
- [Adding nullable columns changes API contracts] -> Keep fields nullable/backward-compatible and regenerate contracts/clients.

## Migration Plan

Add nullable `budget_unit_code` to departments and nullable `source_kind`, `source_reference`, and `source_metadata` to processes. Backfill is not required because existing rows can remain null. Add a partial unique index for department budget-unit codes per organization when present if supported by the migration tooling.

Then add parser utilities, request schemas, the SD-based process creation service/route, OpenAPI examples, and tests. Existing structured process creation keeps working unchanged.

Rollback can disable the new route while leaving nullable columns in place. Existing processes created from SD remain valid process records with ordinary department links.

## Open Questions

- Should the UI later show a review screen before committing the SD-created process?
- Should SD source metadata be visible in normal process responses or only in an audit/detail endpoint once that exists?

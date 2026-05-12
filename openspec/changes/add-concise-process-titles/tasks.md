## 1. Backend Data Model And API

- [x] 1.1 Add nullable `title` storage to the `processes` schema and create the corresponding database migration.
- [x] 1.2 Add a deterministic backend concise-title helper that trims submitted titles, derives from preferred SD item descriptions when available, and falls back to a shortened object/process number.
- [x] 1.3 Update process create/update schemas, OpenAPI examples, serializers, and response schemas so `title` is accepted where appropriate and always exposed as a non-empty response field.
- [x] 1.4 Update manual `createProcess` and `updateProcess` flows to store validated title values while preserving the full `object`.
- [x] 1.5 Update SD text and PDF-backed intake paths to derive/store concise titles from parsed source context without changing source metadata or full object values.

## 2. Frontend Creation And Import

- [x] 2.1 Update generated API client/types after backend schema changes.
- [x] 2.2 Add `title` to process creation form state, validation, request mapping, default values, and model tests.
- [x] 2.3 Add a frontend preview helper for concise title suggestions from manual object text and imported SD fields.
- [x] 2.4 Add a `Título` input to the process creation form and preserve manual title edits from automatic object/import overwrites.
- [x] 2.5 Update the PDF import parser, import preview, and apply-import behavior to include a concise title suggestion while leaving `object` complete.

## 3. Process Display Surfaces

- [x] 3.1 Update process list and detail display helpers to prefer `title` and fall back to an object-derived concise display value for older responses.
- [x] 3.2 Update the process detail page so the heading uses the concise title and the full object remains visible in detail content.
- [x] 3.3 Update frontend fixtures and page tests for listing, detail, and creation/import title behavior.

## 4. Regression Tests And Validation

- [x] 4.1 Add backend tests for title derivation, manual process creation with/without explicit title, update behavior, and serializer fallback for older rows.
- [x] 4.2 Add backend intake tests proving SD item descriptions are preferred for titles and long object/classification text remains intact.
- [x] 4.3 Run focused API process tests.
- [x] 4.4 Run focused web process model/page tests.
- [x] 4.5 Run `openspec validate add-concise-process-titles --strict`.

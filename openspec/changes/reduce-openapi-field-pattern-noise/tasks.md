## 1. Shared Field Schema Support

- [x] 1.1 Add shared documentation-friendly schema helpers or conventions in `apps/api` for common field types such as UUIDs and emails
- [x] 1.2 Ensure the shared helpers preserve runtime validation behavior while simplifying the exported OpenAPI field presentation

## 2. Route Schema Backfill

- [x] 2.1 Update the application-owned route schemas whose field panels still show regex-heavy patterns in Scalar, including UUID and email fields in invites, users, organizations, departments, and processes where applicable
- [x] 2.2 Keep endpoint behavior unchanged while improving only the OpenAPI field-level presentation used by Scalar

## 3. Verification

- [x] 3.1 Regenerate or inspect the exported OpenAPI document to confirm the affected fields no longer surface noisy regex-heavy patterns as the main field presentation detail
- [x] 3.2 Run the relevant backend verification, including `pnpm typecheck`, `pnpm lint`, and any contract-generation step needed to confirm compatibility

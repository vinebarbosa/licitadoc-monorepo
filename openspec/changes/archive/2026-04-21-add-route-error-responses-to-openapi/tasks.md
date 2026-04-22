## 1. Shared Error Response Foundation

- [x] 1.1 Add shared Zod-backed error response schemas under `apps/api/src/shared/http/` for validation, application, and internal server error envelopes that match the current error handler output
- [x] 1.2 Add reusable response-composition helpers or status maps so route schema files can declare relevant error responses without duplicating the same response shapes

## 2. Route Schema Backfill

- [x] 2.1 Update the application-owned route schema files in invites, users, organizations, departments, processes, and documents to declare the relevant error responses alongside success responses
- [x] 2.2 Keep the hidden Better Auth proxy route behavior unchanged while ensuring the visible OpenAPI-backed routes now expose their documented failure responses

## 3. Verification

- [x] 3.1 Add or update tests that validate the shared error response utilities and the affected route-schema contracts where appropriate
- [x] 3.2 Regenerate or inspect the exported OpenAPI document to confirm the new error responses appear in Swagger
- [x] 3.3 Run the existing backend verification needed for the schema updates, including `pnpm test`, `pnpm typecheck`, and the client-generation workflow if the enriched OpenAPI output affects it

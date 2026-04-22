## 1. Shared Body Example Support

- [x] 1.1 Add shared OpenAPI example helpers or constants in `apps/api` for common request-body field types such as UUIDs, slugs, names, dates, and descriptive text
- [x] 1.2 Ensure the shared example pattern can be applied to the final Zod schemas exported in request bodies, including refined and transformed fields

## 2. Request Body Schema Backfill

- [x] 2.1 Update the application-owned create and update body schemas that currently render noisy examples, including invites, departments, organizations, processes, and any similar body schemas in scope
- [x] 2.2 Keep runtime validation, transforms, defaults, and endpoint behavior unchanged while improving only the generated request-body examples

## 3. Verification

- [x] 3.1 Regenerate or inspect the exported OpenAPI document to confirm the affected request bodies now show readable examples in Scalar
- [x] 3.2 Run the relevant backend verification, including `pnpm typecheck`, `pnpm lint`, and any contract-generation step needed to confirm compatibility

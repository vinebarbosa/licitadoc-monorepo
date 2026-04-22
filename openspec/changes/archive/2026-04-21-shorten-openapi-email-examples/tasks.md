## 1. Shared Email Example Support

- [x] 1.1 Add a shared helper or shared schema convention for concise OpenAPI email examples in `apps/api`
- [x] 1.2 Ensure the helper can be applied to the final Zod schemas that feed the exported route contracts

## 2. Route Schema Backfill

- [x] 2.1 Update the application-owned route schemas that expose email fields, including users, invites, and organization email fields, to use explicit readable examples
- [x] 2.2 Keep runtime validation and existing endpoint behavior unchanged while improving only the generated contract examples

## 3. Verification

- [x] 3.1 Regenerate or inspect the exported OpenAPI document to confirm the affected email fields now show concise examples
- [x] 3.2 Run the relevant backend verification, including `pnpm typecheck`, `pnpm lint`, and any contract-generation step needed to confirm compatibility

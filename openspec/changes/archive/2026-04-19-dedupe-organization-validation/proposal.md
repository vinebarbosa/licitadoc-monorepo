## Why

The organizations module currently splits input handling across route-level Zod schemas and service-level normalization helpers, which makes the source of truth unclear and duplicates parts of the same validation. This change is needed now because the new onboarding and update flows for organizations are in place, and we want a clearer contract before more fields and routes build on the same pattern while also preserving the human-readable formatting users type for fields like `phone`, `cnpj`, and `zipCode`.

## What Changes

- Consolidate organization payload parsing so create and update inputs are validated and normalized in a single canonical layer instead of repeating checks across Zod and service helpers.
- Define which organization fields are canonicalized structurally before persistence (`slug`, `state`, `institutionalEmail`, empty optional URLs) and which fields preserve the formatting typed by the user when written to the database (`phone`, `cnpj`, and `zipCode`/CEP).
- Keep domain and authorization checks in the service layer, but stop re-validating payload shape and formatting after request parsing.
- Preserve semantic conflict handling for `cnpj` even when the stored value keeps punctuation.
- **BREAKING** New writes for `cnpj` and `zipCode` will preserve formatting characters instead of being rewritten to digits-only values.
- Add tests that lock in the parsing and persistence behavior for create and update flows.

## Capabilities

### New Capabilities
- `organization-input-canonicalization`: Defines how organization create and update payloads are parsed into the stored format used by the organizations domain, including which fields preserve user formatting.

### Modified Capabilities

## Impact

- Affected code: `/Users/vine/Documents/licitadoc/apps/api/src/modules/organizations/organizations.schemas.ts`, `/Users/vine/Documents/licitadoc/apps/api/src/modules/organizations/organizations.shared.ts`, `/Users/vine/Documents/licitadoc/apps/api/src/modules/organizations/create-organization.ts`, `/Users/vine/Documents/licitadoc/apps/api/src/modules/organizations/update-organization.ts`, and related tests.
- APIs: No new routes; request handling semantics become explicit for canonicalization versus formatting preservation of organization payload fields.
- Data model: `cnpj` uniqueness handling may need an auxiliary normalized comparison path so semantic duplicates are still rejected while the stored field preserves punctuation.
- Dependencies: Reuses existing Zod/Fastify stack; no new external dependency is expected.

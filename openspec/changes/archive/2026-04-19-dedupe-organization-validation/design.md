## Context

The organizations module currently validates request bodies with Zod in `organizations.schemas.ts`, but it also re-checks and normalizes many of the same fields in `organizations.shared.ts` before inserts and updates. That split makes it harder to know where the canonical organization payload is defined, and it increases the chance that create and update flows drift as more fields or routes are added.

This change targets the create and update paths for organizations, which are already stable enough to consolidate around a single parsing boundary. The goal is not to weaken validation, but to move formatting and canonicalization into a single place and leave the service layer focused on authorization, persistence, and conflict handling. The new requirement is that formatted identifiers and contact fields such as `phone`, `cnpj`, and `zipCode` keep the punctuation typed by the user when persisted.

## Goals / Non-Goals

**Goals:**
- Make request parsing the single source of truth for organization input validation and canonicalization.
- Ensure the parsed organization payload already matches the format expected by the database layer, including preserving formatting for selected fields.
- Preserve the current domain checks in services, including onboarding rules, authorization, and unique-constraint translation.
- Preserve semantic uniqueness for `cnpj` even if the stored value includes punctuation.
- Lock the parsing and persistence behavior with tests for both create and update payloads.

**Non-Goals:**
- Changing organization routes, authorization rules, or response payloads.
- Reformatting historical organization records that are already stored without punctuation.
- Refactoring unrelated modules such as invites, users, or documents.

## Decisions

### Decision: Canonicalize organization input in Zod schemas
The request schemas will do both validation and parsing for organization create and update payloads. This keeps the request boundary responsible for producing trusted, normalized input and removes duplicated formatting logic from the service path.

Alternatives considered:
- Keep the current split and only rename helpers from `normalize*` to `sanitize*`.
  Rejected because it improves naming but preserves two sources of truth.
- Move all validation into services and keep Zod shallow.
  Rejected because it weakens the route contract and spreads HTTP parsing logic into domain code.

### Decision: Preserve user formatting for `phone`, `cnpj`, and `zipCode`
The parsing layer will trim surrounding whitespace but will not strip punctuation from `phone`, `cnpj`, or `zipCode` before persistence. These fields are frequently entered and read back in their masked form, so the stored representation should remain human-readable.

Alternatives considered:
- Continue storing digits-only values for all formatted fields.
  Rejected because it discards the representation explicitly entered by the user and conflicts with the desired write behavior.
- Preserve formatting only in responses while storing digits-only internally.
  Rejected because it keeps the current ambiguity about the canonical stored value and still requires a second formatting layer.

### Decision: Keep service-layer business rules separate from request parsing
Service functions will continue enforcing actor permissions, onboarding eligibility, and database conflict mapping. Those checks depend on stored state and transaction context, so they remain domain concerns and should not be merged into request schemas.

Alternatives considered:
- Collapse authorization and input parsing into a single schema-driven step.
  Rejected because authorization depends on runtime actor and database state, not only on request shape.

### Decision: Reuse shared field-level canonicalizers across create and update schemas
Field transforms such as slug normalization, uppercase state, lowercase institutional email, trimming of required text, preservation of formatted `phone`/`cnpj`/`zipCode`, and empty-to-null optional strings will be defined once and composed into both the create and update schemas. Update parsing will only transform fields that are actually present in the request.

Alternatives considered:
- Duplicate transforms in separate create and update schemas.
  Rejected because it recreates the same maintenance problem in a different layer.

### Decision: Keep `cnpj` semantic conflict checks even when formatting is preserved
The write path will preserve the submitted `cnpj` representation in the stored field, but conflict detection must continue to compare the digits-only identity of the value. The implementation may use an auxiliary normalized comparison field or an equivalent persistence-level comparison path, but the contract is that semantically equal `cnpj` values must still collide.

Alternatives considered:
- Rely on raw string uniqueness for `cnpj`.
  Rejected because `12.345.678/0001-90` and `12345678000190` would no longer conflict even though they represent the same organization.

## Risks / Trade-offs

- [Schema transforms become more complex] -> Keep field transforms small and composable, and avoid mixing business rules into them.
- [Behavior changes become more visible at the route boundary] -> Add tests that cover masked values, surrounding whitespace, preserved punctuation, and nullable optional fields so the contract stays explicit.
- [Preserving `cnpj` formatting can weaken uniqueness if implemented naively] -> Require semantic conflict checks based on digits-only comparison rather than raw stored text.
- [Refactor could break current type flow] -> Export inferred parsed input types from the canonical schemas and use them in services to keep compile-time alignment.

## Migration Plan

If the chosen implementation for `cnpj` semantic uniqueness requires an auxiliary normalized comparison field or index, rollout includes a schema migration and backfill for existing rows. If the implementation uses a persistence-level comparison without schema changes, rollout stays in application code only. In either case, rollback consists of restoring the previous parsing and persistence behavior.

## Open Questions

No open questions at this time. The intended behavior is to remove duplicate validation paths while preserving the user-entered formatting for `phone`, `cnpj`, and `zipCode` in stored writes.

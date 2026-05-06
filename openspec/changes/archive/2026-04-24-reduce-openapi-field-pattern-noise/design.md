## Context

`apps/api` exports OpenAPI from Zod-backed route contracts, and Scalar renders not only payload examples but also field-level schema details such as `type`, `format`, `nullable`, and `pattern`. The recent request-body example improvements made the payload blocks more realistic, but several fields still expose raw regex patterns that dominate the UI and distract from the actual contract.

The root issue is no longer missing examples; it is that the exported OpenAPI still carries low-level validation patterns for common field types where a concise type and readable example would be enough for documentation. Because other tooling already consumes `/openapi.json`, the change should stay in the schema/export layer and preserve compatibility.

## Goals / Non-Goals

**Goals:**
- Reduce raw regex-heavy field metadata in Scalar for common application-owned field types such as UUIDs and emails.
- Add a shared convention so docs-friendly field schemas stay consistent across modules.
- Keep readable field examples visible while simplifying the field presentation.
- Preserve runtime validation behavior and compatibility with the generated client workflow.

**Non-Goals:**
- Changing request validation, refinements, or transforms at runtime.
- Rebuilding Scalar or adding custom frontend hacks just to hide fields in the UI.
- Removing every advanced schema keyword from every route in one pass.
- Changing hidden auth proxy routes or unrelated third-party contract sources.

## Decisions

### Decision: Fix field noise in the exported contract instead of customizing Scalar
The unwanted UI comes from OpenAPI schema details that Scalar is faithfully rendering. Improving the contract itself keeps the docs cleaner for every consumer instead of relying on frontend-only presentation workarounds.

Alternatives considered:
- Override Scalar styling or hide schema sections in the UI.
  Rejected because the raw OpenAPI would still remain noisy for other tooling and views.

### Decision: Introduce documentation-friendly shared schema helpers for common field types
UUID and email are repeated throughout the app-owned contracts, so the cleanest approach is to centralize the docs-facing schema convention in the shared HTTP/schema layer.

Alternatives considered:
- Patch each field individually in route modules.
  Rejected because it would duplicate the same documentation convention and drift quickly.

### Decision: Preserve runtime validation while simplifying exported schema details
The implementation should keep the same runtime guarantees while adjusting what gets exported into OpenAPI for documentation-facing schemas.

Alternatives considered:
- Loosen or remove validation patterns from the underlying route schemas.
  Rejected because it would risk behavioral changes outside documentation.

### Decision: Prioritize fields that currently dominate the Scalar field panels
The most visible noise today comes from fields like `organizationId`, UUID arrays, and email inputs that show very long regex patterns in the sidebar field rendering. Those are the highest-value targets for the first pass.

Alternatives considered:
- Expand immediately to every schema keyword in every module.
  Rejected because the smallest useful scope is to clean up the repetitive field types causing the current UI pain.

## Risks / Trade-offs

- [OpenAPI may lose validation detail that some tooling expects] -> Limit the change to application-owned documentation-facing schemas and verify client generation still succeeds.
- [Runtime and exported docs schemas could drift] -> Keep the shared convention centralized and apply it consistently where the docs contract is emitted.
- [The change could become a broad schema-export refactor] -> Scope the work to the repeated regex-heavy field types currently harming readability in Scalar.

## Migration Plan

Add shared docs-friendly field schema helpers, backfill the affected route schemas, regenerate the OpenAPI document, and verify that Scalar field panels show cleaner metadata while `/openapi.json` and generated clients remain compatible. No rollout sequencing is required because this is a contract-shape/documentation improvement only.

## Open Questions

No open questions at this time.

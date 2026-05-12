## Why

The current ETP recipe is safe and structurally correct, but the generated text can remain shallow, generic, or under-specified when compared with a stronger ETP reference. The system needs to produce more complete, technical, and context-aware ETPs while continuing to avoid unsupported facts, invented values, or copied weaknesses from a model document.

## What Changes

- Refine the canonical `etp` recipe so it guides the model to produce deeper analysis of need, solution requirements, alternatives, market/price methodology, impacts, fiscalization, risks, and recommendation.
- Keep one universal ETP recipe that adapts to the inferred nature of the object, including artistic/cultural services, general services, goods, equipment rental, works, technology, health, and education contexts.
- Improve ETP prompt context so the model receives an inferred analysis profile and uses it only to tune technical emphasis, not to invent missing facts.
- Strengthen conservative wording around absent market research, missing estimates, budget availability, dates, duration, location, contractor attributes, technical credentials, and legal claims.
- Add focused tests to verify the ETP recipe and prompt assembly encourage document-quality improvements without simulating market research or changing public APIs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: the `etp` recipe must generate high-quality, technically complete, subject-aware ETPs while preserving the canonical ETP structure and remaining faithful to the supplied process context.

## Impact

- Affects backend ETP recipe assets in `apps/api/src/modules/documents/recipes`.
- Affects backend ETP prompt assembly in `apps/api/src/modules/documents/documents.shared.ts`.
- Affects document generation tests in `apps/api/src/modules/documents`.
- Does not change public API shapes, document lifecycle, database schema, generation provider selection, frontend behavior, or existing generated documents.

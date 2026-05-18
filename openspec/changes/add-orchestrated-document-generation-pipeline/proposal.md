## Why

Document generation currently asks each DFD, ETP, TR, and Minuta recipe to perform extraction, semantic interpretation, planning, drafting, and quality control at the same time. This makes generated drafts fragile: document roles blur, zero values can look like valid estimates, and complex SDs may produce repetitive or generic text.

## What Changes

- Introduce an internal orchestrated document-generation pipeline with specialized stages: extractor, context enrichment, document planning, document writer, structured reviewer, and final rewrite.
- Create a canonical enriched context package that carries extracted facts, normalized item/value evidence, semantic classification, inferences, pending issues, risks, alternatives, tone guidance, and document-specific planning hints.
- Keep the public document-generation interface compatible where possible, while allowing route schemas/OpenAPI to expose optional debug output and pipeline metadata only when explicitly requested.
- Refactor DFD, ETP, TR, and Minuta recipes so document instructions focus on role, limits, structure, tone, anti-hallucination, zero-value handling, signatures, and placeholders.
- Move heavy semantic interpretation into the context enrichment stage, reusing the existing context-enrichment skill/rubric assets as the canonical source of classification and inference behavior.
- Add automatic structured review and up to two targeted rewrite cycles before persisting the final draft.
- Add focused tests for zero-value handling, semantic classification, document-role boundaries, and integration scenarios across different SD profiles.

## Capabilities

### New Capabilities

- `document-generation-pipeline`: Internal pipeline orchestration, canonical context package, structured review, debug trace handling, and bounded rewrite behavior.

### Modified Capabilities

- `document-generation`: Generation requests must be fulfilled through the pipeline while preserving the existing public create/read/list behavior and OpenAPI-derived contracts.
- `document-generation-recipes`: DFD, ETP, TR, and Minuta recipes must become document-role-specific assets that consume enriched context and plans instead of owning broad semantic inference.
- `api-route-schemas`: Document-generation route schemas and exported OpenAPI metadata must describe any new pipeline/debug fields through Zod-backed contracts.

## Impact

- Affected code: `apps/api/src/modules/documents`, document recipe assets, document-generation tests, route schemas, OpenAPI export, and generated API client models if public schemas change.
- API compatibility: existing document-generation requests remain valid; new debug/pipeline fields are additive and opt-in.
- No database migration is expected unless existing document metadata fields cannot store internal pipeline traces.
- Provider behavior: document generation may invoke multiple internal model calls per request for planning, review, and rewrite, bounded by a maximum of two automatic revision cycles.

## Why

Generated procurement documents currently mix Portuguese with and without accents because several repository-managed recipes, prompt labels, and backend fallback snippets are written in ASCII. This makes formal drafts look unfinished and encourages the model to reproduce unaccented headings and prose.

## What Changes

- Update document-generation recipe assets for `dfd`, `etp`, `tr`, and `minuta` so canonical Markdown templates and editorial instructions use correct Brazilian Portuguese accents.
- Update backend prompt assembly labels and final mandatory rules so generation context no longer primes the model with unaccented Portuguese.
- Update backend-generated fallback sections/snippets added during sanitization to use accented formal Portuguese.
- Preserve accent-insensitive comparisons for internal matching, heading detection, parsing, and sanitization where they are intentionally used.
- Add regression coverage that validates recipe/prompt/fallback text keeps formal Portuguese accents while generated-document structure and safety guardrails remain unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: generated procurement document recipes and prompt assembly must use review-ready accented Brazilian Portuguese in formal document-facing text while retaining accent-insensitive internal matching.

## Impact

- Affects backend document recipe assets in `apps/api/src/modules/documents/recipes`.
- Affects backend prompt assembly and sanitization snippets in `apps/api/src/modules/documents/documents.shared.ts`.
- Affects document-generation recipe tests in `apps/api/src/modules/documents`.
- Does not change public API shapes, database schema, provider selection, SSE streaming, or frontend preview behavior.

## Why

Document text adjustments currently fail too often when the selected text is rendered differently from the stored Markdown, especially around headings, uppercase section bodies, line wraps, and browser selection context. When the request does resolve, the generation prompt can lose document structure, causing title markers, paragraphs, and section boundaries to be rewritten as a single malformed block.

## What Changes

- Improve adjustment target resolution so selections can be matched against both rendered text and Markdown source without requiring the user to manually select a larger trecho.
- Send structure-aware context to the AI, including the selected Markdown source, nearby Markdown boundaries, and formatting instructions that preserve headings, paragraphs, lists, and section boundaries.
- Normalize AI responses defensively before applying them so common failures like merging a heading and body into one title are repaired or rejected before persistence.
- Return clearer conflict diagnostics for unresolved selections, including whether the issue was ambiguity, no rendered/source match, or stale context.
- Add regression coverage using real-world payload patterns with uppercase section text, heading prefixes, and nearby section suffixes.

## Capabilities

### New Capabilities

- `document-adjustment-format-context`: Covers structure-aware document adjustment selection, prompting, response normalization, and conflict diagnostics for generated document text edits.

### Modified Capabilities

- None.

## Impact

- Affects `apps/api/src/modules/documents/document-text-adjustment.ts` and document adjustment tests.
- May affect the web preview selection payload shape if richer context is needed, but should remain backward-compatible with the current `selectedText`, `instruction`, and `selectionContext` request.
- No database migration is expected.
- No external dependency change is expected.

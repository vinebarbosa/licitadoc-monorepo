## Why

A generated Minuta PDF is exposing internal template placeholders such as `{{budget.allocation_or_placeholder}}` in the final document. The reference Minuta provided by the user uses human-facing placeholders like `XXX/2025`, `XXXXXXXXXXXXXXXX`, `R$ XXXXXX`, and `XX/XXXXX/XXXX`, so visible `{{...}}` tokens make the document look unfinished and system-generated.

## What Changes

- Standardize visible placeholders in generated Minutas to user-facing `XXX`-style text.
- Ensure unresolved template tokens such as `{{field_or_placeholder}}` never appear in final Markdown, persisted Tiptap JSON, preview, print, or exported PDF.
- Replace Minuta fallbacks that currently pass mustache placeholders into prompts with concrete placeholder text such as `XXX`, `XXX/2026`, `R$ XX.XXX,XX`, `[CONTRATADA]`, or equivalent contract-facing placeholders.
- Add final sanitization for Minuta output so any remaining unresolved template token is converted to an `XXX`-style placeholder instead of leaking into the document.
- Add tests using the RH assessoria Minuta case and the budget allocation clause shown in the PDF/screenshot.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `document-generation`: Generated document output must not expose internal placeholder syntax in final content.
- `document-generation-recipes`: Minuta templates and prompt context must use document-facing placeholders rather than internal mustache fallback tokens.

## Impact

- Affected backend modules: Minuta recipe/template, prompt context assembly, document sanitization, document generation tests.
- Affected outputs: Minuta Markdown, preview, print/PDF rendering, persisted `draftContent`, persisted `draftContentJson`.
- API compatibility: no public request or response shape change is expected.

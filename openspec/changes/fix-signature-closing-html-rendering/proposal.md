## Why

The current closing/signature guidance lets the generation provider interpret alignment as something to express in the generated Markdown, which resulted in literal `<div align="...">` strings appearing in the document preview. This breaks the expected administrative appearance of DFD/ETP/TR drafts and creates a fragile dependency on provider-produced presentation markup.

## What Changes

- Tighten DFD, ETP, and TR recipe instructions so the final closing/signature block is emitted only as plain Markdown text lines.
- Explicitly forbid HTML tags, `align` attributes, inline CSS, tables, or any other markup workaround for layout inside generated document content.
- Move closing block presentation responsibility to the application: generated content should contain semantic text, while Tiptap JSON/preview rendering owns right/center alignment.
- Normalize legacy or provider-returned closing blocks that contain HTML alignment wrappers so stored draft content and previews do not expose literal tags.
- Keep the final signature block visually coherent: local/date aligned to the right; signature line, responsible name, and role centered, without a visible `FECHO`, `ASSINATURA`, or equivalent heading.
- Add regression coverage for provider responses containing `<div align="right">` or `<div align="center">` around closing lines.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: recipe instructions for DFD/ETP/TR closing blocks must require plain Markdown output and forbid provider-generated layout markup.
- `document-generation`: generated drafts must normalize or reject literal HTML alignment wrappers in closing/signature content before storage and preview conversion.

## Impact

- Affects document recipe instruction assets under `apps/api/src/modules/documents/recipes/`.
- Affects document generation normalization and Markdown-to-Tiptap conversion around generated draft content.
- Affects generated document preview behavior for DFD/ETP/TR signature blocks.
- Adds or updates API tests for generation responses and shared Tiptap/normalization tests.
- May add focused web preview coverage if the visual regression is best verified at the rendered preview layer.

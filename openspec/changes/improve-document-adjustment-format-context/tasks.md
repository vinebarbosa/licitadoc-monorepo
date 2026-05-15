## 1. Selection Resolution

- [x] 1.1 Add or refactor a Markdown rendered-source projection that preserves source offsets and block metadata for headings, paragraphs, list items, and adjacent section boundaries.
- [x] 1.2 Implement normalized matching strategies for exact source, rendered projection, context-anchored rendered text, and case-insensitive rendered text when context disambiguates one target.
- [x] 1.3 Ensure body-only selections under headings remain scoped to the body while using the heading prefix as context.
- [x] 1.4 Ensure selections that include or cross Markdown syntax expand to safe structural source boundaries without leaving dangling heading/list/inline markers.
- [x] 1.5 Return structured conflict diagnostics for no match, ambiguous match, and context mismatch cases.

## 2. Structure-Aware Prompting

- [x] 2.1 Build selected-source metadata containing rendered selected text, exact source Markdown target, nearby Markdown excerpt, block type, and surrounding heading/section boundaries.
- [x] 2.2 Update `buildDocumentTextAdjustmentPrompt` to include the selected Markdown source and explicit formatting-preservation rules.
- [x] 2.3 Add instruction-specific guidance so body paragraph rewrites do not duplicate or merge surrounding headings.
- [x] 2.4 Keep prompt context bounded to avoid sending unnecessarily large document excerpts.

## 3. Replacement Normalization And Safety

- [x] 3.1 Strip provider wrappers such as code fences, explanations, and surrounding quotes from suggested replacements.
- [x] 3.2 Normalize common heading-plus-body mistakes by preserving the original Markdown heading line and placing rewritten body text in a separate paragraph.
- [x] 3.3 Validate body-only replacements so they do not introduce headings or adjacent sections unless explicitly allowed by the user instruction.
- [x] 3.4 Reject structurally unsafe provider output before returning a suggestion.

## 4. Tests And Verification

- [x] 4.1 Add API regression tests for the provided uppercase paragraph payload with heading prefix and next-section suffix.
- [x] 4.2 Add API tests for heading-plus-body selections that must preserve heading separation.
- [x] 4.3 Add API tests for ambiguous repeated rendered text and context mismatch diagnostics.
- [x] 4.4 Add API tests for unsafe provider output rejection and safe normalization.
- [x] 4.5 Run focused document adjustment tests, API typecheck, and OpenSpec validation.

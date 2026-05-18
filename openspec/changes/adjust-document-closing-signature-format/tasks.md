## 1. Recipe Assets

- [x] 1.1 Update DFD, ETP, and TR instruction assets to prohibit visible `FECHO`, `ASSINATURA`, or equivalent closing headings and describe the required closing alignment.
- [x] 1.2 Update `dfd-template.md`, `etp.template.md`, and `tr.template.md` to remove the `FECHO` heading and end with local/date, signature line, responsible name, and responsible role.
- [x] 1.3 Ensure generated draft sanitization does not preserve accidental closing headings when the provider returns otherwise valid DFD, ETP, or TR content.

## 2. Previewable Document Structure

- [x] 2.1 Extend Markdown-to-Tiptap conversion to recognize the canonical closing block and assign right alignment to local/date.
- [x] 2.2 Extend Markdown-to-Tiptap conversion to assign centered alignment and no first-line indentation to the signature line, responsible name, and responsible role.
- [x] 2.3 Update preview/editor styling or tests that depend on `FECHO`/`ASSINATURA` headings so the new generated path renders without a visible closing title.
- [x] 2.4 Confirm edit/save flows preserve the previewable Tiptap JSON alignment while keeping plain Markdown fallback readable.

## 3. Validation

- [x] 3.1 Update recipe resolver tests to assert DFD, ETP, and TR templates no longer contain `## FECHO` and do contain the canonical signature line block.
- [x] 3.2 Add shared Tiptap conversion tests covering right-aligned local/date and centered signature paragraphs.
- [x] 3.3 Update document generation tests to assert stored DFD, ETP, and TR drafts omit closing headings and expose aligned previewable JSON.
- [x] 3.4 Update document preview tests to assert the local/date renders right-aligned and the signature line, name, and role render centered without relying on a `FECHO` heading.
- [x] 3.5 Run the affected API and web test suites for document recipes, generation, Tiptap conversion, and preview rendering.

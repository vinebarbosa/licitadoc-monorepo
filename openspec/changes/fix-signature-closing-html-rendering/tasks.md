## 1. Recipe Contract

- [x] 1.1 Update `dfd-instructions.md`, `etp.instructions.md`, and `tr.instructions.md` so the closing block rule requires plain Markdown text only.
- [x] 1.2 Explicitly forbid HTML tags, `align`, inline CSS, tables, comments, code fences, and renderer directives for closing/signature alignment in all three document recipes.
- [x] 1.3 Review `dfd-template.md`, `etp.template.md`, and `tr.template.md` to ensure their closing placeholders remain semantic plain lines with no visible `FECHO`, `ASSINATURA`, or layout markup.

## 2. Backend Normalization

- [x] 2.1 Add a narrow sanitizer for DFD/ETP/TR generated closing blocks that converts simple alignment wrappers such as `<div align="right">texto</div>` and `<div align="center">texto</div>` into plain text.
- [x] 2.2 Integrate the sanitizer into `sanitizeGeneratedDocumentDraft` before completed drafts are persisted and before `documentTextToTiptapJson` is called.
- [x] 2.3 Ensure sanitized `draftContent` never persists literal `<div>`, `</div>`, or `align=` strings when those strings were only used to align local/date, signature, responsible name, or role.
- [x] 2.4 Verify `documentTextToTiptapJson` still applies right alignment to local/date and center alignment to signature line, responsible name, and role after normalization.

## 3. Preview Behavior

- [x] 3.1 Verify the completed document detail response prefers cleaned content and previewable JSON for generated DFD/ETP/TR drafts.
- [x] 3.2 If the cleaned signature block still splits awkwardly across pages in normal preview conditions, add the smallest Tiptap/preview styling hook needed to keep the final signature lines visually coherent.
- [x] 3.3 Confirm the preview keeps raw HTML rendering disabled and does not rely on provider-generated markup for alignment.

## 4. Tests and Verification

- [x] 4.1 Add recipe tests asserting DFD/ETP/TR instructions forbid HTML/layout markup for closing blocks and describe plain Markdown output.
- [x] 4.2 Add sanitizer or generation tests with provider output containing `<div align="right">` and `<div align="center">` around the closing lines.
- [x] 4.3 Assert cleaned `draftContent` contains the expected local/date/name/role text without literal HTML alignment tags.
- [x] 4.4 Assert `draftContentJson` contains the expected right/center paragraph alignment attributes for the closing block.
- [x] 4.5 Add or update preview tests to ensure the literal strings `<div` and `align=` do not render in completed DFD/ETP/TR previews.
- [x] 4.6 Run the focused API tests for document generation recipes, document generation, and shared Tiptap conversion.
- [x] 4.7 Run the focused web preview tests if preview styling changes are made.
- [x] 4.8 Run the relevant typecheck/format/lint command for touched packages.

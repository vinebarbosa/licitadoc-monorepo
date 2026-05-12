## 1. Recipe Assets

- [x] 1.1 Update `dfd-instructions.md` and `dfd-template.md` so formal instructions, headings, labels, and reusable prose use accented Brazilian Portuguese.
- [x] 1.2 Update `etp.instructions.md` and `etp.template.md` so formal instructions, headings, labels, and reusable prose use accented Brazilian Portuguese.
- [x] 1.3 Update `tr.instructions.md` and `tr.template.md` so formal instructions, headings, labels, and reusable prose use accented Brazilian Portuguese.
- [x] 1.4 Update `minuta.instructions.md` and `minuta.template.md` so formal instructions, headings, labels, fixed-clause prose, and placeholders remain structurally equivalent while using accented Brazilian Portuguese where appropriate.

## 2. Prompt Assembly And Sanitization

- [x] 2.1 Update generic and document-specific prompt assembly strings in `documents.shared.ts` to use accented Portuguese for document-facing labels, section names, final rules, and fallback guidance.
- [x] 2.2 Update sanitizer-injected fallback headings and prose for ETP, TR, and minuta to use accented Portuguese.
- [x] 2.3 Preserve accent-insensitive helpers and regex behavior used only for comparison, heading detection, and sanitization.
- [x] 2.4 Review source-extracted/user-entered values, internal identifiers, slugs, enum values, metadata keys, and error codes to avoid unnecessary or unsafe accent changes.

## 3. Regression Tests

- [x] 3.1 Update existing document-generation recipe and prompt tests that assert unaccented Portuguese snippets.
- [x] 3.2 Add coverage proving loaded recipe assets for `dfd`, `etp`, `tr`, and `minuta` include accented formal Portuguese in key headings/labels/prose.
- [x] 3.3 Add coverage proving assembled prompts use accented document-facing labels and still include the same factual context values.
- [x] 3.4 Add coverage proving sanitizer fallback sections use accented Portuguese and accent-insensitive heading matching still works for supported document types.

## 4. Validation

- [x] 4.1 Run focused API document-generation recipe tests.
- [x] 4.2 Run the broader API document test target if focused tests pass.
- [x] 4.3 Review a generated prompt sample for DFD plus one of ETP/TR/minuta to confirm formal Portuguese accents are present without changing source values.

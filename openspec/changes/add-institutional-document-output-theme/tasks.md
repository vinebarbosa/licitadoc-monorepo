## 1. Theme Foundation

- [x] 1.1 Create an institutional document output theme boundary under the documents frontend module.
- [x] 1.2 Define reusable theme tokens for A4 page sizing, print margins, typography, spacing, sections, lists, administrative fields, signature blocks, and pagination selectors.
- [x] 1.3 Expose stable root/body selectors or class names for HTML preview and print/PDF-ready rendering.
- [x] 1.4 Ensure the theme boundary does not render logos, brasão, watermark, decorative bands, or graphic branding.

## 2. Page And Typography Application

- [x] 2.1 Update the document sheet to consume the institutional theme instead of hardcoded page layout classes.
- [x] 2.2 Apply the A4 portrait white page surface and exact print/PDF content margins of 100px top, 80px bottom, and 90px left/right.
- [x] 2.3 Apply the institutional font stack: `Times New Roman`, `Liberation Serif`, `serif`.
- [x] 2.4 Apply 12pt black body text, 13pt bold uppercase titles, and 12pt bold subtitles.
- [x] 2.5 Preserve responsive screen preview behavior so narrow viewports remain usable while print/PDF output keeps exact margins.

## 3. Markdown Structure Rendering

- [x] 3.1 Update `DocumentMarkdownPreview` to use institutional theme classes/tokens for headings, paragraphs, lists, blockquotes, tables, inline code, links, horizontal rules, and emphasis.
- [x] 3.2 Style the main title as centered, bold, uppercase, with 28px bottom margin.
- [x] 3.3 Style numbered section headings with 22px top margin and 12px bottom margin.
- [x] 3.4 Style body paragraphs as fully justified with 45px first-line indent, line-height 1.55, and 12px paragraph spacing.
- [x] 3.5 Preserve safe Markdown link handling and raw/unsafe content blocking.

## 4. Administrative Fields, Lists, And Signature

- [x] 4.1 Add or reuse rendering patterns for administrative fields such as Unidade Orçamentária, Número da Solicitação, Data de Emissão, Processo, and Objeto.
- [x] 4.2 Ensure administrative field labels render bold and values render normal with clean vertical spacing.
- [x] 4.3 Style bullet lists with standard black bullets, 40px left indent, 10px item spacing, and justified item text.
- [x] 4.4 Preserve bold leading phrases inside list items when provided by Markdown.
- [x] 4.5 Add signature block styling for final city/UF/date, centered responsible name, centered role/cargo, and 60px spacing before the block.

## 5. Print And Pagination

- [x] 5.1 Move or update print styles so they target the institutional document output root.
- [x] 5.2 Enable print/PDF-ready hyphenation where supported.
- [x] 5.3 Add widow and orphan controls where supported.
- [x] 5.4 Add break rules to reduce headings left alone at page end, bad paragraph breaks, and poor list breaks.
- [x] 5.5 Keep app chrome, preview actions, live status controls, and non-document UI hidden from printed output.

## 6. Cross-Type Reuse

- [x] 6.1 Verify DFD completed previews use the institutional theme.
- [x] 6.2 Verify ETP, TR, and Minuta completed previews can use the same theme without document-type-specific visual branching.
- [x] 6.3 Verify live generated document previews continue using the same theme while text streams in.
- [x] 6.4 Confirm the implementation leaves explicit extension points for future logo, watermark, footer, institutional bands, and organization colors without rendering them now.

## 7. Tests And Visual Verification

- [x] 7.1 Update document preview tests to assert institutional root selectors and no forbidden branding elements.
- [x] 7.2 Add or update tests for typography-relevant Markdown output, including title, section, paragraph, list, administrative field, and signature examples.
- [x] 7.3 Add or update tests for print/PDF selectors and non-document UI hiding.
- [x] 7.4 Run the relevant web test suite for document preview and router behavior.
- [x] 7.5 Run web typecheck.
- [x] 7.6 Visually inspect representative DFD output at desktop and narrow viewport sizes.
- [x] 7.7 Inspect print/PDF-ready layout enough to confirm margins, typography, and page-break behavior are reasonable.

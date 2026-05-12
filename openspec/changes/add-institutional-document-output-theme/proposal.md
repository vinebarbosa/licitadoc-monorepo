## Why

Generated document previews and print/PDF output need a reusable institutional layout that looks like an official Brazilian public-sector document, not just an application-rendered Markdown page. The previous A4 preview work established the page surface; this change standardizes the professional typography, spacing, pagination, and structural patterns that all document types should share.

## What Changes

- Introduce a reusable institutional document output theme for HTML and print/PDF-ready rendering.
- Standardize A4 portrait page layout with white background and fixed content margins:
  - top: 100px
  - bottom: 80px
  - left: 90px
  - right: 90px
- Standardize typography:
  - primary font: Times New Roman
  - fallback: Liberation Serif, serif
  - body: 12pt, black
  - titles: 13pt, bold, uppercase
  - subtitles: 12pt, bold
- Standardize reading behavior:
  - fully justified body text
  - first-line indent of 45px
  - line-height 1.55
  - 12px paragraph spacing
  - automatic hyphenation where supported
  - reduced orphan/widow and bad page-break behavior
- Standardize document structure:
  - centered uppercase main title
  - numbered uppercase sections
  - controlled spacing around sections
  - clean administrative field rows
  - formal list spacing
  - final signature block layout
- Add reusable rendering/theme boundaries so the same visual system serves DFD, ETP, TR, and Minuta.
- Keep layout extensible for future logos, coat of arms, watermark, footer, institutional bands, and organization-specific colors.
- Explicitly do not implement logos, coat of arms, watermark, decorative bands, or graphic branding in this change.

## Capabilities

### New Capabilities

- `institutional-document-output-theme`: Defines the reusable institutional HTML/print/PDF-ready presentation rules for generated procurement documents.

### Modified Capabilities

None.

## Impact

- Affected frontend document rendering:
  - `apps/web/src/modules/documents/ui/document-preview-page.tsx`
  - `apps/web/src/modules/documents/ui/document-markdown-preview.tsx`
  - `apps/web/src/styles.css`
- Likely new frontend rendering/theme module(s) under `apps/web/src/modules/documents`.
- Affected tests:
  - `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
  - route or rendering tests that assert document preview headings/styles
- No backend generation recipe or text-generation provider changes are expected.
- No real logo/branding asset pipeline is introduced in this scope.

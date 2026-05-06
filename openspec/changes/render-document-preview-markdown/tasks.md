## 1. Dependency And Component Setup

- [x] 1.1 Add Markdown rendering dependencies to `@licitadoc/web`, using `react-markdown` and `remark-gfm`.
- [x] 1.2 Create a documents-module `DocumentMarkdownPreview` component that accepts trusted-as-data Markdown text and renders it read-only.
- [x] 1.3 Configure the renderer without raw HTML support and without `dangerouslySetInnerHTML`.
- [x] 1.4 Map Markdown elements to styled React elements for headings, paragraphs, lists, blockquotes, inline code, code blocks, links, and tables.

## 2. Preview Page Integration

- [x] 2.1 Replace the completed-document `<pre>` preview in `DocumentPreviewPageUI` with `DocumentMarkdownPreview`.
- [x] 2.2 Preserve the existing preview page metadata, navigation, loading, error, generating, failed, and empty-content states.
- [x] 2.3 Ensure rendered tables use a horizontally scrollable container on narrow screens.
- [x] 2.4 Ensure Markdown links use safe URL behavior and appropriate link attributes.

## 3. Tests

- [x] 3.1 Update document preview fixtures with Markdown content that includes headings, emphasis, lists, links, and a table.
- [x] 3.2 Add or update React tests proving Markdown headings, lists, emphasis, and tables render as semantic elements.
- [x] 3.3 Add React tests proving raw HTML/script content is not executed or mounted as executable DOM.
- [x] 3.4 Add React tests proving existing generating, failed, empty-content, and error states still bypass Markdown rendering.
- [x] 3.5 Add or update Playwright coverage for a completed document preview showing rendered Markdown structure.

## 4. Verification

- [x] 4.1 Run the relevant document preview React tests.
- [x] 4.2 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 4.3 Run `pnpm --filter @licitadoc/web lint`.
- [x] 4.4 Run relevant Playwright/e2e coverage for the document preview page.
- [x] 4.5 Run `openspec status --change "render-document-preview-markdown"` and confirm the change is apply-ready.

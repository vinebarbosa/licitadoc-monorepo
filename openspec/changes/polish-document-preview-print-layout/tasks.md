## 1. Document Sheet Layout

- [x] 1.1 Refactor `DocumentSheet` in `document-preview-page.tsx` to use a document-specific page wrapper instead of the shared `Card` for rendered document content.
- [x] 1.2 Remove hardcoded "Órgão não informado" and "Unidade requisitante não informada" text from the document surface when no real metadata is available.
- [x] 1.3 Remove the UI-generated formal title, artificial `OBJETO` section based on `document.name`, separators, and appended responsible/signature footer from the document surface.
- [x] 1.4 Keep the live-generation status indicator available without replacing or obscuring the rendered document body.
- [x] 1.5 Add stable preview/document selectors or class names needed for screen layout, print CSS, and tests.

## 2. Formal Markdown Typography

- [x] 2.1 Update `DocumentMarkdownPreview` styles so headings, paragraphs, lists, blockquotes, horizontal rules, and inline formatting read like a formal document.
- [x] 2.2 Improve table styling for document review, including borders, spacing, wrapping, and screen overflow handling.
- [x] 2.3 Remove the left-border body treatment currently passed from `DocumentSheet`.
- [x] 2.4 Preserve existing safe-link and unsafe-content behavior while changing typography.

## 3. Print Styling

- [x] 3.1 Add scoped print styles in `apps/web/src/styles.css` for the document preview route/sheet.
- [x] 3.2 Hide preview actions, app chrome, and non-document UI from printed output.
- [x] 3.3 Remove screen-only page decoration in print, including shadows, rounded corners, app background, and decorative borders.
- [x] 3.4 Add print-friendly page margins and break behavior for headings, paragraphs, lists, and tables.

## 4. Live Preview Compatibility

- [x] 4.1 Verify completed documents and generating documents both use the same document sheet and Markdown presentation.
- [x] 4.2 Preserve the existing live-writing endpoint and auto-follow behavior after the sheet refactor.
- [x] 4.3 Preserve the planning progress panel behavior before visible document text is available.

## 5. Tests and Verification

- [x] 5.1 Update `document-preview-page.test.tsx` to assert placeholders, artificial object text, and appended UI signature labels are no longer rendered.
- [x] 5.2 Update completed-preview tests to assert the generated Markdown title/body remain semantic and visible inside the formal sheet.
- [x] 5.3 Update live-generation tests to assert partial content still renders and auto-follow still scrolls to the live-writing endpoint.
- [x] 5.4 Add or update assertions for print/action selectors so print CSS can target the intended elements.
- [x] 5.5 Run the relevant web test suite for document preview behavior.
- [x] 5.6 Visually inspect the preview in a browser at desktop and narrow widths to confirm the sheet, typography, and live-writing layout do not overlap or clip.

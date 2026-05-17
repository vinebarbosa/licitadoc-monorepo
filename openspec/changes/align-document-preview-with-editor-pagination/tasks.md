## 1. Audit Current Document Render Paths

- [x] 1.1 Confirm where document detail responses expose `draftContent`, `draftContentJson`, document status, and cache updates in the web client.
- [x] 1.2 Identify the editor TipTap extension set, document sheet styles, page-break rendering, and paragraph/list indentation rules used by the validated editor.
- [x] 1.3 Identify the completed preview Markdown render path and the live-generation render path so only completed JSON preview behavior is changed.

## 2. Shared TipTap Document Surface

- [x] 2.1 Extract shared TipTap extensions needed by both editable and read-only document rendering, including links, underline, highlight, text alignment, indentation attributes, keyboard-safe page-break support, and any AI marks that can exist in JSON.
- [x] 2.2 Extract or create shared document sheet/page-surface components and styles for sheet width, margins, paragraph typography, list indentation, alignment, page gaps, and print behavior.
- [x] 2.3 Make page-break rendering consistent across screen and print, with no visible label and with the app background visible between page sheets.

## 3. Completed Preview JSON Rendering

- [x] 3.1 Update completed preview source selection to prefer `draftContentJson` when available and use `draftContent` only as a legacy fallback.
- [x] 3.2 Add a read-only TipTap preview renderer that uses the shared document surface and renders saved JSON without enabling editing controls.
- [x] 3.3 Preserve existing preview states and actions, including loading, retryable error, forbidden/not found, generating, failed, empty content, print, export buttons, and live-generation display.
- [x] 3.4 Keep the preview text-selection adjustment panel working on the read-only JSON-rendered body.

## 4. Editor/Page-Break Round Trip

- [x] 4.1 Ensure the protected editor persists page-break nodes in TipTap JSON without losing them on save.
- [x] 4.2 Ensure saved page breaks reload correctly in the editor and appear at the same content positions in preview.
- [x] 4.3 Ensure legacy documents without `draftContentJson` still open in preview and, when editable, derive a safe editor-ready JSON representation.

## 5. Tests and Verification

- [x] 5.1 Add or update model/unit tests for JSON-vs-text preview source selection and legacy fallback behavior.
- [x] 5.2 Add or update page tests proving saved TipTap JSON renders in preview with headings, paragraphs, lists, inline marks, alignment, indentation, and page breaks.
- [x] 5.3 Add or update tests for print/page-break CSS behavior where feasible in the existing test setup.
- [x] 5.4 Run the relevant web tests and type checks.
- [ ] 5.5 Verify manually in the browser that editing, saving, opening preview, and page-break display match between `/app/documento/:documentId` and `/app/documento/:documentId/preview`.

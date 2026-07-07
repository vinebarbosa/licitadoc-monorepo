## Why

The document edit page currently carries unrelated demo/assistant UI and does not behave like a focused document editor. Users need a clean editing page whose primary surface is the document and whose header exposes the formatting controls needed for direct editing.

## What Changes

- Replace the current document edit page experience with a page-only editor layout focused on the active document.
- Remove unrelated UI from the edit page, including demo-only affordances, assistant/suggestion controls, side panels, and non-editing decorations.
- Add a persistent editor header with document navigation/save actions and formatting controls.
- Keep existing document loading, unavailable-state handling, dirty-state tracking, save behavior, conflict/error feedback, and preview navigation where they are part of the editing workflow.
- Ensure formatting controls operate on the active editor selection and expose clear accessible labels.

## Capabilities

### New Capabilities
- `document-editor-page`: Defines the focused document edit page, including page scope, required header actions, formatting controls, editor behavior, and unrelated UI removals.

### Modified Capabilities

## Impact

- Affected frontend code under `apps/web/src/modules/documents`, especially the document edit page UI and related tests.
- May reuse existing document API hooks, Tiptap JSON content utilities, document pagination/sheet rendering, shared UI primitives, and document editor extensions.
- No backend API contract changes are expected.
- Existing browser/component tests for document editing will need updates to assert the simplified page and formatting header.

## Why

The public document editor demo needs a lightweight page ruler so users can orient spacing, margins, and paragraph/tab indentation while editing long formal documents. The current toolbar exposes formatting controls, but there is no page-level guide that communicates where the editable text area starts, ends, or how paragraph indentation relates to the page.

## What Changes

- Add a visual ruler above the document sheet in the public document editor demo.
- Show measurement ticks aligned to the usable page width rather than the whole viewport.
- Display subtle margin and paragraph/tab guide markers that match the editor theme.
- Keep the ruler non-disruptive: it is a guide only, not a full measurement or layout engine.
- Preserve the current TipTap editing experience and existing AI selection workflow.

## Capabilities

### New Capabilities

- `document-editor-ruler-guide`: Defines the public document editor ruler guide, including visible page measurements, margin indicators, and paragraph/tab indentation guidance.

### Modified Capabilities

None.

## Impact

- Affects the public document editor demo route at `/demo/documento/editor`.
- Affects frontend presentation and keyboard guidance only.
- No API, database, authentication, or backend dependency changes.

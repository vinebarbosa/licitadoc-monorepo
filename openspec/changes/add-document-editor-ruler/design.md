## Context

The public document editor demo renders a TipTap editor inside a document-like sheet. The demo already has a sticky formatting toolbar and page-like visual spacing, but users do not have a page ruler to understand the usable text width, margins, paragraph indentation, or tab stops. The requested experience is closer to document editors such as Google Docs: a subtle horizontal ruler that acts as a layout guide without distracting from the document.

## Goals / Non-Goals

**Goals:**

- Add a compact ruler below the formatting toolbar and above the document canvas.
- Align the ruler with the editable body width inside the sheet, not with the whole viewport.
- Show page margin regions, numbered measurement ticks, and visible paragraph/tab markers.
- Provide enough visual feedback for first-line indent and paragraph left indent decisions.
- Keep the demo fluid and consistent with the existing LicitaDoc visual language.

**Non-Goals:**

- Implement a full page layout engine or replace TipTap pagination.
- Add persistent document schema for margins, tabs, or indentation.
- Add drag-and-drop ruler editing in this demo iteration.
- Introduce TipTap Pro page/ruler extensions or new commercial dependencies.

## Decisions

- Render the ruler as a React/CSS guide rather than as TipTap document content.
  - Rationale: the ruler is chrome for the editing surface, not part of the document JSON.
  - Alternative considered: encode ruler markers in TipTap JSON; rejected because it would pollute document content.

- Keep markers static but semantically useful.
  - Rationale: the demo needs a clear guide for spacing/tab behavior now, while draggable ruler state would imply persistence and document layout guarantees that do not exist yet.
  - Alternative considered: implement draggable handles; deferred until the app has real paragraph style persistence.

- Align the ruler with shared CSS variables that also define sheet padding.
  - Rationale: changing page padding in one place should keep the ruler and document body visually aligned.
  - Alternative considered: duplicate pixel math in the component; rejected because it is brittle across responsive breakpoints.

- Use keyboard Tab behavior to complement the ruler.
  - Rationale: the visual ruler should communicate indentation while Tab/Shift+Tab preserve expected paragraph/list behavior.
  - Alternative considered: only render the ruler; rejected because the user specifically called out tab behavior for paragraphs.

## Risks / Trade-offs

- Static ruler could look interactive → Use subtle affordances and avoid drag cursor styling.
- Ruler alignment could drift on mobile or zoom changes → Define ruler width and content inset with the same variables used by the sheet.
- Browser Tab handling could conflict with accessibility navigation → Scope custom Tab behavior to the editor surface and keep the AI input reachable by click, not by accidental tab focus during selection.

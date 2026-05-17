## Context

The validated public editor demo already expresses the target experience: a focused document canvas, compact formatting controls, page-like spacing, subtle AI instruction input, selection feedback, and Portuguese review actions. The protected editor route currently exists only as a partially wired implementation and still depends on Markdown/HTML conversion rather than Tiptap's native JSON document model.

The backend stores generated draft text in `documents.draft_content`. That text remains useful for existing generation, preview, and export flows, but it is not the right primary editing shape for Tiptap because it loses editor-native node structure and complicates selection-based AI operations.

## Goals / Non-Goals

**Goals:**
- Reuse the validated `/demo/documento/editor` UI patterns for `/app/documento/:documentId`.
- Persist editable content as Tiptap JSON and expose it in document detail/update API contracts.
- Keep existing documents editable by deriving JSON from existing draft text when no JSON has been saved yet.
- Preserve preview/export compatibility by maintaining a text representation alongside the editor JSON.
- Keep stale-save protection and organization scoping on document updates.

**Non-Goals:**
- Replace the document generation recipe format in this change.
- Implement a production AI provider for selected-text rewrite operations.
- Redesign the validated editor UI.
- Remove the legacy text draft field before preview/export flows are fully migrated.

## Decisions

1. Store editor content in a new `draft_content_json` JSONB column.
   - Rationale: Tiptap JSON is structured data and should not be serialized into a text field as the source of truth.
   - Alternative considered: replace `draft_content` entirely. Rejected because preview/export and existing generated documents still depend on the text representation.

2. Return both compatibility text and editor JSON during the transition.
   - Rationale: the protected editor can use JSON immediately while existing preview/export consumers continue to work.
   - Alternative considered: make `draftContent` change type from string to JSON. Rejected because it would create a broad breaking change across clients and tests.

3. Derive initial JSON server-side when a document has only legacy text.
   - Rationale: the API should provide the editor-ready JSON shape, so the web app does not need to know about backend fallback rules.
   - Alternative considered: convert Markdown in the browser. Rejected because the user explicitly wants the API/database path to bring JSON for Tiptap.

4. Keep a text projection updated when saving JSON.
   - Rationale: preview/export can continue rendering saved edits before those surfaces are migrated to JSON.
   - Alternative considered: leave `draftContent` unchanged after JSON saves. Rejected because preview would not show edits made in the real editor.

5. Use the public demo as the implementation source for the protected editor UI.
   - Rationale: the interaction has been validated through screenshots and browser feedback, including AI input focus, selection feedback, page gaps, toolbar states, and Portuguese labels.
   - Alternative considered: evolve the older protected editor. Rejected because it would duplicate the design process and risk drifting from the approved UI.

## Risks / Trade-offs

- JSON/text divergence -> update both fields from the same save operation and make JSON the editable source of truth.
- Markdown fallback is lossy for complex legacy content -> preserve headings, paragraphs, lists, and emphasis enough for generated procurement drafts; richer legacy migration can be refined later.
- API client churn -> regenerate the client after schemas change and update the document editor hooks together.
- Existing public demo drift -> keep the demo available and share the production editor surface where practical so future UI adjustments can be validated in one place.

## Context

The current document edit route is implemented in the documents module, but its main editing experience is imported from the public document editor demo page. That demo experience includes concerns that do not belong on the real edit page, including assistant prompt surfaces, suggestion flows, demo context presentation, and extra controls that distract from the document.

The implementation should keep the useful production behavior already in place: document detail loading, completed-document gating, JSON editor content, dirty detection, save with `sourceContentHash`, conflict/error handling, preview navigation, and unsaved-change protection. The change is primarily a frontend simplification and ownership cleanup for the edit page.

## Goals / Non-Goals

**Goals:**
- Make the document edit page a focused page-only workspace for editing the selected document.
- Remove unrelated demo, assistant, suggestion, and decorative surfaces from the edit page.
- Provide a persistent header with document actions and formatting controls.
- Keep the editor backed by the existing Tiptap JSON content model so saved drafts remain compatible with preview/export flows.
- Keep the implementation inside the documents module, using shared UI primitives and existing document editor extensions.

**Non-Goals:**
- Changing backend document APIs, document generation, or save payload contracts.
- Reworking the document preview page or document creation flow.
- Adding AI-assisted editing, adjustment suggestions, comments, collaborative editing, or review workflows.
- Replacing Tiptap with another editor engine.

## Decisions

1. Own the real edit experience in `apps/web/src/modules/documents` instead of importing the public demo experience.

   The real document edit page should not depend on `apps/web/src/modules/public/pages/document-editor-demo-page.tsx` because that component owns demo and assistant behavior. A dedicated documents-module editor shell can expose only the production page concerns. The alternative was adding feature flags to the demo experience to hide unwanted UI, but that would preserve a confusing dependency and make future cleanup harder.

2. Build a single persistent page header for both commands and formatting.

   The header should contain navigation/save/preview state plus editor formatting controls, with compact icon buttons, menus where option sets are natural, separators, tooltips, and accessible labels. This keeps the active document and its commands in one predictable place. The alternative was a floating toolbar above the sheet, but the user specifically asked for a header and the page should feel less fragmented.

3. Reuse the existing Tiptap JSON editor extensions and document sheet rendering.

   Existing document content is stored as Tiptap JSON and preview/export paths expect compatible structure and attributes. The editor should use the existing extension set, especially headings, underline, highlight, text alignment, links, indentation, keyboard shortcuts, and document-specific marks. The alternative was to revive the older HTML-based `DocumentTiptapEditor`, but that would risk incompatibility with saved JSON drafts.

4. Preserve production data and save behavior while replacing presentation.

   The page should continue to load only editable completed documents with valid draft JSON, track dirty state from editor JSON, save through the existing document save hook with `sourceContentHash`, and guard navigation when unsaved changes exist. This limits the change to the broken page surface rather than expanding into API behavior.

## Risks / Trade-offs

- Formatting controls can become dense on smaller screens -> Group controls into compact sections and allow wrapping or horizontal overflow without overlapping the document.
- Moving away from the demo component can duplicate small pieces of editor setup -> Extract documents-module helpers only where they reduce real duplication and keep the first implementation scoped.
- JSON editor updates can be noisy for dirty detection -> Compare serialized editor JSON to the last saved JSON, as the current page already does.
- Removing demo/assistant UI could remove behavior someone informally used on the edit page -> This is intentional for the requested cleanup; future assistant editing should return as a separate explicit capability.

## Migration Plan

1. Add or replace documents-module editor UI so the route renders a focused edit page owned by the documents module.
2. Remove the import and use of `DocumentAgentEditorExperience` from the document edit page.
3. Wire the new header controls to the active Tiptap editor instance and preserve save/navigation behavior.
4. Update component and browser tests for the simplified edit page and formatting header.
5. Validate with web tests and a browser pass on the document edit route.

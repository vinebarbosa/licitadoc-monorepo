## 1. Backend JSON Contract

- [x] 1.1 Add `draft_content_json` storage and schema typing for Tiptap JSON.
- [x] 1.2 Add API schemas for Tiptap JSON detail reads and update requests.
- [x] 1.3 Serialize completed documents with stored JSON or a legacy text-to-JSON fallback.
- [x] 1.4 Update save logic to persist JSON, refresh compatibility text, and hash JSON source content.
- [x] 1.5 Update API tests for JSON reads, saves, stale conflicts, and organization scoping.

## 2. Web Editor Integration

- [x] 2.1 Wire `/app/documento/:documentId` to the protected document editor route.
- [x] 2.2 Reuse the validated `/demo/documento/editor` UI patterns for the protected editor.
- [x] 2.3 Initialize Tiptap from `draftContentJson` and save `editor.getJSON()`.
- [x] 2.4 Preserve validated selection feedback, AI input emphasis, Portuguese suggestion actions, page gaps, paragraph indentation, list indentation, and Tab behavior.
- [x] 2.5 Keep preview links and save-state feedback working from the real document detail data.

## 3. Client Types And Validation

- [x] 3.1 Regenerate the API client after schema changes.
- [x] 3.2 Update web tests and MSW handlers for the JSON document contract.
- [x] 3.3 Run relevant API and web validation commands.
- [x] 3.4 Verify the protected editor in the browser using the already validated demo as the visual reference.

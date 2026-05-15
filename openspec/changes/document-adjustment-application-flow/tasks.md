## 1. Backend Adjustment Reliability

- [x] 1.1 Review `document-text-adjustment` target resolution paths for exact, context-based, and markdown-aware selections and fix gaps that cause valid rendered selections to fail.
- [x] 1.2 Ensure suggestion requests reject ambiguous/unresolvable selections before provider invocation with user-facing error messages.
- [x] 1.3 Ensure apply requests persist only the resolved source target and return the updated serialized document for cache refresh.
- [x] 1.4 Preserve stale hash and mismatched source text conflict behavior so outdated suggestions cannot overwrite newer document content.

## 2. Frontend Pending Selection State

- [x] 2.1 Add preview state for a single active adjustment target, including selected text, pending phase, suggestion response, and error state.
- [x] 2.2 Add a document preview decoration/skeleton helper that marks the active selected rendered trecho with a gray skeleton during suggestion/apply pending states.
- [x] 2.3 Wire the skeleton lifecycle so it appears while generating a suggestion, remains while applying, and clears on success, failure, discard, or panel dismissal.
- [x] 2.4 Ensure successful apply updates the document detail cache/preview from the API response and clears the selection panel.
- [x] 2.5 Ensure generating, failed, unavailable, or empty previews do not expose the text adjustment prompt.

## 3. UX and Error Handling

- [x] 3.1 Show clear panel errors for empty instructions, ambiguous selections, provider failures, stale content conflicts, and apply failures.
- [x] 3.2 Keep the selected trecho visible in the panel while pending and prevent duplicate suggestion/apply submissions during in-flight operations.
- [x] 3.3 Preserve current document scrolling, print/export actions, and live generation behavior while adjustment UI is active.

## 4. Verification

- [x] 4.1 Add or update API tests for resolvable selections, ambiguous selections, stale hash conflicts, mismatched source targets, and persisted replacement content.
- [x] 4.2 Add or update document preview tests for selection prompt visibility, skeleton display during suggestion, skeleton display during apply, skeleton clearing on error/dismissal, and updated preview content after apply.
- [x] 4.3 Run focused API document adjustment tests.
- [x] 4.4 Run focused web document preview tests.
- [x] 4.5 Run API and web typecheck/lint checks required for touched files.

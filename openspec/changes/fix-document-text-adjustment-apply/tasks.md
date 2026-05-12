## 1. Backend Contract

- [x] 1.1 Extend text-adjustment suggestion/apply schemas with a stable source target payload (`start`, `end`, `sourceText`) and regenerate OpenAPI output as needed.
- [x] 1.2 Update adjustment response/request types so suggestion returns the resolved source target and apply accepts it with `sourceContentHash`.
- [x] 1.3 Keep existing authorization, completed-draft, empty-input, and stale-hash validation behavior intact.

## 2. Backend Target Resolution

- [x] 2.1 Refactor target resolution so suggestion resolves the selected rendered text before calling the text-generation provider.
- [x] 2.2 Add exact source matching as the first resolution strategy.
- [x] 2.3 Add a Markdown-aware fallback that can match rendered selections from paragraphs, headings, emphasis, list markers, and administrative list fields back to source offsets.
- [x] 2.4 Make ambiguous or unresolvable selections fail without provider calls or document updates.
- [x] 2.5 Update apply persistence to replace the validated source target range instead of searching for `selectedText` again.

## 3. API Client And Web Flow

- [x] 3.1 Regenerate `@licitadoc/api-client` after schema changes.
- [x] 3.2 Add a focused throwing client/wrapper for document text-adjustment mutations so non-2xx responses reach React Query `onError`.
- [x] 3.3 Update the preview apply request to send the returned source target with `sourceContentHash` and replacement text.
- [x] 3.4 On successful apply, update the document detail query cache from the returned document detail and invalidate related document queries.
- [x] 3.5 On apply failure, keep the adjustment panel open, show the backend error message, and avoid success toasts.

## 4. Tests

- [x] 4.1 Add API tests for successful paragraph selection apply using the resolved source target.
- [x] 4.2 Add API tests for rendered administrative/list-field selection that omits Markdown list markers but still maps to the correct source range.
- [x] 4.3 Add API tests proving stale, mismatched, ambiguous, and unresolvable targets leave `draftContent` unchanged.
- [x] 4.4 Add web tests proving a 409 apply response shows an error and does not call the success toast.
- [x] 4.5 Add web tests proving successful apply updates the visible preview from the returned persisted draft content.

## 5. Verification

- [x] 5.1 Run focused API document tests.
- [x] 5.2 Run focused web document preview tests.
- [x] 5.3 Run API client generation/typecheck for affected packages.
- [x] 5.4 Run `openspec validate fix-document-text-adjustment-apply --strict`.

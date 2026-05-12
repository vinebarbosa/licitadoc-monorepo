## 1. Backend Adjustment API

- [x] 1.1 Add document text-adjustment request/response schemas for suggestion and apply endpoints.
- [x] 1.2 Implement a prompt builder that sends selected text, user instruction, document type, and bounded document context to the text-generation provider.
- [x] 1.3 Implement deterministic target resolution for applying a replacement to current `draftContent`, including stale/ambiguous selection safeguards.
- [x] 1.4 Implement a suggestion service that validates authorization, completed draft content, non-empty selection, and non-empty instruction without persisting content.
- [x] 1.5 Implement an apply service that persists the accepted replacement, updates `updatedAt`, and returns the refreshed document detail.
- [x] 1.6 Register the new document adjustment routes and expose them through OpenAPI.

## 2. Web Preview Experience

- [x] 2.1 Regenerate the API client after the new routes are exposed.
- [x] 2.2 Add document adjustment API hooks for generating suggestions and applying accepted replacements.
- [x] 2.3 Capture text selections only inside completed document preview content and hide the prompt for ineligible states.
- [x] 2.4 Render a floating adjustment input anchored near the selection with submit, loading, and dismiss states.
- [x] 2.5 Render the generated suggestion with `Aplicar` and `Descartar` actions.
- [x] 2.6 Apply accepted replacements by calling the backend, invalidating/refetching document detail, and clearing the selection panel.
- [x] 2.7 Surface validation/provider errors without breaking existing preview, print, and export actions.

## 3. Tests

- [x] 3.1 Add API tests for suggestion authorization, empty input validation, provider prompt context, and no persistence before apply.
- [x] 3.2 Add API tests for successful apply, stale/ambiguous selection rejection, and unchanged content on failure.
- [x] 3.3 Add web tests for showing/hiding the floating prompt based on document selection and status.
- [x] 3.4 Add web tests for suggestion review, discard behavior, successful apply, refetch, and error messaging.
- [x] 3.5 Update MSW fixtures/handlers and generated client usage as needed.

## 4. Validation

- [x] 4.1 Run focused API document tests.
- [x] 4.2 Run focused web document preview tests.
- [x] 4.3 Run API client generation and verify generated artifacts compile.
- [x] 4.4 Run web and API typecheck.
- [x] 4.5 Run Biome checks for changed files.
- [x] 4.6 Run `openspec validate add-document-text-adjustment-prompt --strict`.

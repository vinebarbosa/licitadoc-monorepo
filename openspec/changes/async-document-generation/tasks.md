## 1. API Generation Flow

- [x] 1.1 Refactor `createDocument` so it validates actor/process visibility, creates the document and generation run with `generating` status, stores the generation input snapshot in `requestMetadata`, and returns before invoking the provider.
- [x] 1.2 Extract background generation execution into a documents module function that loads a pending run/document, invokes `textGeneration.generateText`, sanitizes output, and marks document/run `completed`.
- [x] 1.3 Normalize provider and unexpected failures in the background executor and persist document/run `failed` state with error metadata.
- [x] 1.4 Add an API-local generation queue/worker that schedules newly created runs after transaction commit and recovers persisted `generating` runs on app startup.

## 2. API Contracts And Tests

- [x] 2.1 Update document module unit tests to assert create returns a `generating` document before provider completion.
- [x] 2.2 Add tests for successful background completion, failed background completion, and idempotent handling when a run is no longer pending.
- [x] 2.3 Update route/OpenAPI expectations if response examples or timing assumptions change.
- [x] 2.4 Regenerate the API client after API schema changes.

## 3. Web Experience

- [x] 3.1 Update document creation success handling so the UI treats mutation success as "generation started" instead of "content ready".
- [x] 3.2 Add or adjust document detail polling while status is `generating`, stopping once status becomes `completed` or `failed`.
- [x] 3.3 Update MSW fixtures and web tests for pending document creation and pending preview/detail states.

## 4. Verification

- [x] 4.1 Run focused API document tests.
- [x] 4.2 Run focused web document tests.
- [x] 4.3 Run typecheck or the relevant package checks for changed API/web packages.

## Why

Document generation currently waits for the text provider to finish before the create request returns, which makes the user-facing flow slow and vulnerable to provider timeouts. Generation should become asynchronous so users can create a document immediately, see it in `generating` status, and continue while the system completes or fails the draft in the background.

## What Changes

- Change document creation so `POST /api/documents/` persists a generated document and generation run, returns a `201` response with status `generating`, and does not wait for provider output before responding.
- Add a background generation execution path that loads the persisted generation context, invokes the configured provider, sanitizes generated content, and finalizes the document as `completed` or `failed`.
- Preserve the existing organization/process authorization and document visibility rules for create, list, and detail reads.
- Ensure read endpoints and web views continue surfacing `generating`, `completed`, and `failed` states so clients can refresh or poll for completion.
- Add automated coverage for the asynchronous response, successful background completion, failed background completion, and status reads while generation is pending.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: Document generation requests now enqueue or schedule provider execution asynchronously and return the persisted pending document before generation finishes.

## Impact

- Affected API code: document creation service, document routes, generation run persistence, and tests under `apps/api/src/modules/documents`.
- Affected web code: document creation success navigation, document detail/preview polling or refresh behavior, MSW fixtures, and generated API client types if the OpenAPI contract changes.
- Affected infrastructure: the API process needs an in-process background worker or equivalent local job runner; no external queue dependency is required unless implementation proves the existing runtime cannot safely handle it.

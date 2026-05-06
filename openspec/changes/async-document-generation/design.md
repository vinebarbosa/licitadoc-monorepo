## Context

The current document creation path validates actor visibility, assembles the prompt, creates a `documents` row and a `document_generation_runs` row, then calls `textGeneration.generateText` inside the same request transaction. This couples request latency and database transaction duration to provider latency, including the provider timeout window.

The database already has the lifecycle primitives needed for asynchronous execution: `documents.status`, `documents.draftContent`, and `document_generation_runs` with provider metadata, request metadata, response metadata, failure fields, and timestamps. The web app already understands `generating`, `completed`, and `failed` states in the document list/detail surfaces.

## Goals / Non-Goals

**Goals:**

- Make `POST /api/documents/` return after the pending document and generation run are persisted.
- Execute provider calls outside the HTTP request lifecycle and outside the create transaction.
- Preserve create-time authorization, organization scoping, document naming, recipe usage, content sanitization, and normalized provider failure handling.
- Allow document detail/list reads to expose pending, completed, and failed states consistently while the background work progresses.
- Keep the first implementation deployable without an external queue dependency.

**Non-Goals:**

- Add a distributed queue, multi-process leasing system, or provider-specific orchestration service.
- Change the set of supported document types or generation recipes.
- Add user-driven retry controls in the first implementation, beyond preserving failed state for later inspection.
- Stream partial provider output to the client.

## Decisions

1. Use a small API-local background executor for generation jobs.

   The create service will enqueue a persisted generation run after its transaction commits. A new document-generation worker module will own the provider call and final status updates. This keeps implementation scope low and fits the current single API runtime. An external queue was considered, but it would add deployment and operations work before the product needs distributed job processing.

2. Treat the database rows as the source of truth, not in-memory queue state.

   The background executor should receive only the document/run identifiers, then reload the generation run and document before doing work. The create transaction must persist enough `requestMetadata` for the worker to reconstruct or use the intended generation input. This avoids losing the authoritative job state if the in-memory queue is cleared.

3. Snapshot the generation input at create time.

   The create path already loads the process, organization, departments, document type, and operator instructions under the requesting actor's authorization. It should store the assembled prompt or equivalent normalized input in `document_generation_runs.requestMetadata` before returning. This preserves the current synchronous behavior where generation uses request-time context even if the process changes shortly after creation.

4. Finalize with idempotent status transitions.

   The worker should only complete or fail documents/runs that are still in `generating` status. On success it sanitizes the provider output by document type, stores `draftContent`, marks the document and run `completed`, and records provider response metadata. On provider or unexpected failure it marks both as `failed` and stores the normalized error fields.

5. Recover pending runs on API startup.

   During app startup, after database and text-generation plugins are available, the worker should scan for `generating` runs/documents and schedule them. This gives pending jobs a path to completion after process restarts without adding new schema in this change.

6. Poll from the web where a user is waiting on a pending document.

   Document detail/preview queries should refetch while the status is `generating` and stop polling once the document reaches `completed` or `failed`. The create page can navigate to the preview/detail for the returned document or the documents list, but it must no longer imply that the draft content is already available when the mutation succeeds.

## Risks / Trade-offs

- API process exits after response before the in-memory job starts -> startup recovery scans persisted `generating` runs and schedules them again.
- Duplicate scheduling processes the same run more than once -> worker reloads current state and performs final updates only while the document/run are still `generating`.
- Request metadata stores a large prompt -> acceptable for current document sizes, but the implementation should keep metadata structured and avoid storing provider secrets.
- In-process execution is not horizontally robust -> acceptable for the first implementation; a future change can replace the executor with a durable queue without changing public API behavior.
- Web polling increases read traffic -> poll only for `generating` documents and use a modest interval.

## Migration Plan

1. Add the worker module and refactor document creation so the create transaction persists pending state and returns before provider execution.
2. Register the worker with the API after the database and text-generation plugins are ready, including startup recovery for existing `generating` runs.
3. Update API tests and OpenAPI-generated client types.
4. Update web mutation handling, pending-state polling, fixtures, and tests.

Rollback is code-only: restoring synchronous creation keeps the existing database schema compatible because this change uses the current lifecycle columns and generation-run metadata.

## Open Questions

- None for this proposal. User-facing retry can be specified in a later change once asynchronous generation is in place.

## Context

The API already supports `POST /api/processes/from-expense-request` with JSON text input. That flow parses deterministic SD text, resolves the scoped organization and departments, and creates a process with source metadata such as `fileName` and `sourceLabel`. What is still missing is the first-mile intake step: accepting the original PDF, extracting the text from it, and keeping the original file as a canonical source asset.

Today the API has no multipart upload plugin, no PDF extraction utility, and no object-storage configuration. The local development stack only starts Postgres. The existing `documents` table includes `storageKey`, but it is oriented to process documents and generated drafts, not to intake source files that exist before the process is created.

## Goals / Non-Goals

**Goals:**

- Accept a direct SD PDF upload through the API.
- Persist the uploaded PDF in S3-compatible object storage using LocalStack in local development.
- Extract text from the uploaded PDF deterministically and feed that text into the existing SD parsing and scoped process-creation workflow.
- Preserve source-file traceability on the created process without storing raw PDF bytes in Postgres.
- Keep the existing JSON text intake route working unchanged.

**Non-Goals:**

- OCR for scanned/image-only PDFs.
- Generic document/file management outside the SD intake flow.
- Presigned upload URLs or browser-direct uploads.
- Download endpoints for the stored source PDF in this change.
- Malware scanning, retention policies, or production bucket hardening beyond basic configuration hooks.

## Decisions

### Decision: Add a dedicated multipart PDF intake route alongside the existing text route

Add a route such as `POST /api/processes/from-expense-request/pdf` that accepts `multipart/form-data` with one required PDF file plus the same optional scoping overrides already supported by the text route (`organizationId`, `departmentIds`, `sourceLabel`). The current JSON text route stays available for tests, scripts, and fallback flows.

This keeps the transport concerns isolated: the text route continues to validate structured JSON, while the new route owns file validation, size limits, and multipart parsing. It also keeps the OpenAPI contract clearer than overloading the existing body schema with a union of JSON and multipart inputs.

Alternatives considered:

- Overload `POST /api/processes/from-expense-request` to accept both JSON and multipart bodies.
  Rejected because it makes validation, OpenAPI examples, and route handling harder to reason about.
- Require clients to upload the PDF elsewhere and continue sending extracted text.
  Rejected because it preserves the current manual gap and loses the canonical source asset inside the platform.

### Decision: Introduce a storage provider abstraction with an S3-compatible adapter configured for LocalStack

Add a small file-storage contract, registered as a Fastify plugin in the same style as `textGeneration`. The first adapter is S3-compatible and uses LocalStack in development via environment variables for endpoint, region, bucket, access key, secret, and path-style mode. The service should expose a simple operation for storing the uploaded expense-request PDF and returning normalized file metadata (`bucket`, `key`, `contentType`, `size`, `etag` when available).

Using an interface keeps the intake workflow decoupled from LocalStack-specific setup while still honoring the product decision to use LocalStack for local object storage. It also makes unit tests easier because the route/service can depend on a fake in-memory storage implementation.

Alternatives considered:

- Write uploaded PDFs to the local filesystem.
  Rejected because the user explicitly wants LocalStack and a filesystem path does not resemble the production storage model.
- Store the PDF bytes in Postgres.
  Rejected because source files are better handled as objects, and large blobs would create avoidable database bloat.

### Decision: Upload first, then parse from the validated file bytes, with best-effort cleanup on downstream failure

The route should fully validate the file part (`application/pdf`, non-empty, size limit) and stream/buffer it once. After a successful object-storage write, the workflow should parse the same validated bytes into text and then continue into process creation. If text extraction or database writes fail after the upload, the service should attempt to delete the stored object so the bucket does not accumulate orphaned files without a corresponding process.

This ordering guarantees that successful process creation always points at a real stored object. Reusing the already-read bytes avoids an immediate download round-trip from LocalStack while still treating the stored object as the durable source of truth.

Alternatives considered:

- Parse first and upload only after process creation succeeds.
  Rejected because a created process could end up without its canonical source file if upload fails late.
- Re-download the object from LocalStack before parsing.
  Rejected because it adds latency and complexity without changing the business outcome.

### Decision: Split the current SD intake workflow into a shared service that both routes can reuse

Refactor the existing text-based route so the core workflow accepts normalized intake input: extracted expense-request text plus optional source-file metadata. The existing JSON route provides text directly; the new PDF route provides extracted text after upload and PDF parsing. Organization resolution, department matching, source-reference derivation, warnings, and process creation continue to live in one shared service.

This avoids behavior drift between the text and PDF entry points and keeps tests focused on transport-specific concerns versus shared business rules.

Alternatives considered:

- Implement a completely separate PDF-only process-creation service.
  Rejected because it would duplicate the already-correct scope and mapping rules.

### Decision: Persist source-file traceability inside process source metadata instead of adding a new table

Keep the current `processes.sourceKind`, `sourceReference`, and `sourceMetadata` model, and extend `sourceMetadata` with a `sourceFile` object containing the storage reference and upload metadata. A representative shape is:

- `sourceFile.fileName`
- `sourceFile.contentType`
- `sourceFile.storageBucket`
- `sourceFile.storageKey`
- `sourceFile.sizeBytes`
- `sourceFile.etag`
- `sourceFile.uploadedAt`

This keeps the change additive and aligned with the existing SD intake implementation, which already uses `sourceMetadata` for extracted fields and warnings. A dedicated `source_assets` table can be introduced later if the product needs cross-process file browsing, lifecycle management, or download authorization rules.

Alternatives considered:

- Add a dedicated relational table for uploaded source assets now.
  Deferred because the immediate need is traceability for a process-bound intake flow, not a generic asset domain.
- Reuse the `documents` table for the uploaded SD PDF.
  Rejected because that table models process documents and generated drafts, while the PDF is an upstream intake artifact.

## Risks / Trade-offs

- [Some PDFs may be scanned or otherwise non-extractable as text] -> Reject them with a clear validation error and keep OCR explicitly out of scope for this change.
- [Multipart handling and OpenAPI examples are more complex than JSON routes] -> Isolate multipart parsing in one route and cover it with end-to-end tests.
- [LocalStack behavior can differ from AWS S3 in edge cases] -> Use the official S3 client and keep adapter behavior strictly within common S3-compatible features.
- [Uploads that succeed before later failures can leave orphaned objects] -> Attempt delete-on-failure and keep objects under a dedicated prefix for operational cleanup if needed.
- [Large PDFs can create memory pressure if buffered carelessly] -> Enforce a conservative multipart size limit and reject files above that threshold.

## Migration Plan

1. Add LocalStack to `docker-compose.yml` and document the required storage environment variables in `apps/api/.env.example`.
2. Add the storage adapter/plugin and register it in the API app bootstrap.
3. Add multipart support and the new PDF intake route.
4. Add PDF text extraction and the shared intake service refactor so both routes reuse the same process-creation logic.
5. Extend process source metadata serialization, OpenAPI examples, and tests.

No database migration is required if the new file reference lives inside the existing JSON source metadata. Rollback can disable the new route and storage plugin while leaving already-created process metadata and stored files intact.

## Open Questions

- Future work may add a read/download endpoint for stored source PDFs, but this change keeps traceability-only behavior.

## Resolved During Implementation

- The maximum accepted SD PDF size is 3 MB.
- Password-protected PDFs are rejected explicitly.

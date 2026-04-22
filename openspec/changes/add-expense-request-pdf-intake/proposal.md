## Why

The current expense-request intake flow already creates a process from extracted SD text, but operators still need an external/manual step to obtain that text from the original PDF. Accepting the PDF directly is the next natural step because it removes that friction and preserves the canonical source file for later audit, troubleshooting, and downstream document work.

## What Changes

- Add a direct expense-request PDF intake flow that accepts the original PDF file and rejects invalid or unreadable uploads before process creation.
- Store uploaded SD PDFs in LocalStack-backed object storage with stable object keys and source metadata before parsing.
- Extract text from the stored PDF and reuse the existing deterministic expense-request parsing and scoped process-creation workflow.
- Persist source-file traceability on the created process so the system keeps the file name, content type, storage key, and extraction warnings without returning raw file bytes in process responses.
- Extend local development configuration so the API can talk to LocalStack for object storage.

## Capabilities

### New Capabilities
- `expense-request-pdf-intake`: Covers direct PDF upload, LocalStack-backed source-file persistence, deterministic PDF text extraction, and process creation from the extracted SD content.

### Modified Capabilities
- `process-management`: Processes created from imported source files must preserve source-file traceability metadata alongside the existing process profile.

## Impact

- Affected API modules: `apps/api/src/modules/processes`, new shared PDF parsing/storage utilities, route schemas, OpenAPI examples, and tests.
- Affected infrastructure/config: `docker-compose.yml`, `apps/api/.env.example`, Fastify config/plugins, and LocalStack bucket settings.
- Affected dependencies: an S3-compatible storage client and a PDF text-extraction library.
- Affected data model: process source metadata may need explicit file-storage fields or a dedicated source-asset reference, while raw PDF bytes stay out of Postgres.

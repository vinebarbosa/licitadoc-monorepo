## 1. Storage And Upload Foundations

- [x] 1.1 Add LocalStack object-storage setup to `docker-compose.yml` and document the required storage environment variables in `apps/api/.env.example`
- [x] 1.2 Add multipart upload support plus a file-storage plugin/adapter that stores SD PDFs in the configured S3-compatible bucket and returns normalized file metadata
- [x] 1.3 Enforce PDF-specific upload validation, including required file presence, media type checks, and a conservative file-size limit

## 2. PDF Intake Workflow

- [x] 2.1 Add a PDF text-extraction utility that turns uploaded SD PDFs into deterministic machine-readable text and rejects unreadable/image-only inputs
- [x] 2.2 Refactor the existing expense-request intake flow into a shared service so JSON text intake and PDF intake reuse the same scope resolution and process-creation rules
- [x] 2.3 Implement `POST /api/processes/from-expense-request/pdf` so it uploads the PDF, extracts the text, creates the scoped process, persists source-file traceability metadata, and performs best-effort object cleanup on downstream failure

## 3. Contracts And Verification

- [x] 3.1 Update process route schemas, OpenAPI/Postman examples, and any generated contracts needed for the new multipart PDF intake route and source-file metadata shape
- [x] 3.2 Add automated coverage for successful PDF intake, invalid upload validation, storage failure handling, unreadable PDF rejection, and scope/department resolution reuse

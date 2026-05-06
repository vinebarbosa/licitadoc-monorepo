## ADDED Requirements

### Requirement: Browser PDF loader configures pdfjs worker
The web PDF loader MUST configure the `pdfjs-dist` worker before requesting a PDF document in browser builds.

#### Scenario: Worker source is set before reading PDF
- **WHEN** the default PDF loader is used to read a PDF in the web app
- **THEN** `pdfjs-dist` has `GlobalWorkerOptions.workerSrc` set to a bundled local worker URL before `getDocument` is called

#### Scenario: Missing worker source does not abort valid imports
- **WHEN** a user selects a valid machine-readable PDF in the process creation import dialog
- **THEN** the import flow does not fail with `No "GlobalWorkerOptions.workerSrc" specified.`
- **AND** the dialog proceeds to PDF text extraction and preview or to a domain-specific import error

### Requirement: PDF loader remains testable with injected loaders
The PDF extraction helper MUST continue to support an injected `PdfLoader` for unit tests and non-browser execution.

#### Scenario: Injected loader bypasses default pdfjs setup
- **WHEN** a test calls `extractTextFromExpenseRequestPdf` with an injected loader
- **THEN** the helper uses the injected loader to extract text
- **AND** the test does not need to start a real PDF worker

### Requirement: PDF import hides technical loader details from users
The process PDF import flow MUST avoid exposing raw `pdfjs` worker configuration errors to users or leaking them through ad-hoc console logging.

#### Scenario: Worker setup fails unexpectedly
- **WHEN** PDF loading fails due to a worker or pdfjs setup problem
- **THEN** the dialog shows the existing friendly PDF read failure category
- **AND** the code does not emit a raw `console.log(error)` from the error conversion path

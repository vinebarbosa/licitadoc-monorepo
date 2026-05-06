## ADDED Requirements

### Requirement: Expense request PDF intake MUST accept a direct PDF upload
The system MUST allow authorized actors to submit a Solicitação de Despesa PDF directly for process intake. The upload request MUST require exactly one PDF file and MAY include the same optional organization, department, and source-label overrides supported by the text-based intake flow.

#### Scenario: Authorized actor submits a valid expense request PDF
- **WHEN** an authenticated actor uploads one valid SD PDF and optional intake overrides
- **THEN** the system accepts the upload and continues the intake workflow

#### Scenario: Request uses an invalid file payload
- **WHEN** an actor submits no file, more than one file, an empty file, or a non-PDF file for SD intake
- **THEN** the system rejects the request before creating a process

### Requirement: Expense request PDF intake MUST persist the uploaded file in object storage before process creation
The system MUST store the uploaded SD PDF in the configured object-storage backend before it creates a process from that file. The stored object MUST yield stable source-file metadata that can be attached to the resulting process.

#### Scenario: Stored upload yields source-file metadata
- **WHEN** a valid SD PDF upload is accepted
- **THEN** the system stores the file in object storage and records file metadata such as file name, content type, and storage location for the intake result

#### Scenario: Object storage write fails
- **WHEN** the system cannot persist the uploaded SD PDF to object storage
- **THEN** the system rejects the intake request and does not create a process

### Requirement: Expense request PDF intake MUST extract machine-readable SD text deterministically
The system MUST extract machine-readable text from the uploaded PDF and MUST feed that text into the existing expense-request parsing workflow. The extraction step MUST reject unreadable or unsupported PDFs instead of guessing missing text through generative parsing.

#### Scenario: Extractable PDF produces expense-request text
- **WHEN** the uploaded SD PDF contains machine-readable text for the expected SD fields
- **THEN** the system extracts text from the PDF and uses that text as the intake source for process creation

#### Scenario: PDF text cannot be extracted reliably
- **WHEN** the uploaded SD PDF is unreadable, image-only, encrypted, or otherwise lacks the required machine-readable text
- **THEN** the system rejects the request before creating a process

### Requirement: Expense request PDF intake MUST reuse scoped process-creation rules after extraction
After extracting text from a stored SD PDF, the system MUST reuse the same organization-scope, department-resolution, and process-creation rules used by expense-request text intake. The created process MUST remain scoped to the resolved organization and MUST preserve PDF-source traceability.

#### Scenario: Uploaded PDF creates a scoped process
- **WHEN** an authorized actor uploads an SD PDF whose extracted content resolves to one allowed organization and at least one allowed department
- **THEN** the system creates the process inside that organization and links the PDF-source traceability to it

#### Scenario: Uploaded PDF resolves outside actor scope
- **WHEN** an `organization_owner` or `member` uploads an SD PDF whose extracted organization context conflicts with the actor's allowed organization scope
- **THEN** the system rejects the request and does not create a process

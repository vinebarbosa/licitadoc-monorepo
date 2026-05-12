## MODIFIED Requirements

### Requirement: Expense request PDF intake MUST extract machine-readable SD text deterministically
The system MUST extract machine-readable text from the uploaded PDF and MUST feed that text into the existing expense-request parsing workflow. The extraction step MUST reject unreadable or unsupported PDFs instead of guessing missing text through generative parsing. The restored extraction and normalization behavior MUST match the post-`elevate-minuta-contractual-quality` checkpoint and MUST NOT include post-checkpoint item-table segmentation, row-value preservation, component hierarchy reconstruction, or structured item-evidence cleanup rules.

#### Scenario: Extractable PDF produces expense-request text
- **WHEN** the uploaded SD PDF contains machine-readable text for the expected SD fields
- **THEN** the system extracts text from the PDF and uses that text as the intake source for process creation

#### Scenario: PDF text cannot be extracted reliably
- **WHEN** the uploaded SD PDF is unreadable, image-only, encrypted, or otherwise lacks the required machine-readable text
- **THEN** the system rejects the request before creating a process

#### Scenario: PDF extraction excludes post-checkpoint structured item reconstruction
- **WHEN** the uploaded SD PDF contains an item table after the rollback
- **THEN** the extraction workflow feeds deterministic text into the checkpoint parser without reconstructing structured item arrays, component hierarchies, row-value evidence, or item-structure diagnostics introduced after the checkpoint

### Requirement: Expense request PDF intake MUST reuse scoped process-creation rules after extraction
After extracting text from a stored SD PDF, the system MUST reuse the same organization-scope, department-resolution, and process-creation rules used by expense-request text intake. The created process MUST remain scoped to the resolved organization and MUST preserve PDF-source traceability. The restored PDF intake flow MUST NOT persist post-checkpoint structured item arrays or structured item diagnostics through source metadata.

#### Scenario: Uploaded PDF creates a scoped process
- **WHEN** an authorized actor uploads an SD PDF whose extracted content resolves to one allowed organization and at least one allowed department
- **THEN** the system creates the process inside that organization and links the PDF-source traceability to it

#### Scenario: Uploaded PDF resolves outside actor scope
- **WHEN** an `organization_owner` or `member` uploads an SD PDF whose extracted organization context conflicts with the actor's allowed organization scope
- **THEN** the system rejects the request and does not create a process

#### Scenario: PDF-created process excludes post-checkpoint item arrays
- **WHEN** a process is created from an uploaded SD PDF after the rollback
- **THEN** the stored source metadata preserves checkpoint PDF-source traceability without post-checkpoint structured item arrays, component hierarchies, or item-structure diagnostics

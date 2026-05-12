## MODIFIED Requirements

### Requirement: Expense request intake MUST extract process creation data from SD text
The system MUST parse submitted Solicitação de Despesa text into normalized process creation context before creating a process. The parser MUST extract available SD fields and MUST return warnings for missing or ambiguous optional values instead of inventing data. The restored parser MUST match the post-`elevate-minuta-contractual-quality` checkpoint and MUST NOT expose post-checkpoint structured item arrays, item components, item-structure diagnostics, or scalable multi-item parsing as part of the normalized process creation context.

#### Scenario: Extracting process fields from SD text
- **WHEN** an authorized actor submits SD text containing prefeitura CNPJ, unidade orçamentária, request number, issue date, process type, classification/object, justification, item description, values, and responsible signer
- **THEN** the system extracts those fields into normalized process creation context

#### Scenario: Missing required process fields
- **WHEN** submitted SD text does not contain required process fields such as request number, issue date, process type, object/classification, or justification
- **THEN** the system rejects the request before creating a process

#### Scenario: Missing optional SD fields
- **WHEN** submitted SD text omits optional values such as item value or source label
- **THEN** the system records an intake warning without fabricating the missing values

#### Scenario: Intake omits post-checkpoint structured item arrays
- **WHEN** the system parses SD text after the rollback
- **THEN** the normalized output uses the checkpoint representative item context and does not return structured top-level item arrays, component hierarchies, or item-structure diagnostics introduced after the checkpoint

### Requirement: Expense request intake MUST create a scoped process with source traceability
The system MUST create a process from normalized SD context using the existing process ownership model, linking it to the resolved organization and departments and preserving structured source traceability for later document generation. The restored source traceability MUST match the checkpoint behavior and MUST NOT persist post-checkpoint `sourceMetadata.extractedFields.items` arrays or structured item diagnostics.

#### Scenario: Successful SD-backed process creation
- **WHEN** an authorized actor submits valid SD text that resolves to one organization and at least one department
- **THEN** the system creates a draft process with extracted type, process number, external id, issue date, object, justification, responsible name, department links, and SD source metadata

#### Scenario: Duplicate SD-derived process number
- **WHEN** an actor submits SD text that derives a process number already used in the same organization
- **THEN** the system rejects the request with a conflict response

#### Scenario: Raw SD text is not returned
- **WHEN** the system returns the created process response
- **THEN** the response includes the process profile and source metadata without returning the raw submitted SD text

#### Scenario: Source metadata excludes post-checkpoint item arrays
- **WHEN** a process is created from SD intake after the rollback
- **THEN** the stored source metadata does not include post-checkpoint structured `extractedFields.items` arrays, component hierarchies, or item-structure diagnostics

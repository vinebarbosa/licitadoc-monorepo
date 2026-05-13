## MODIFIED Requirements

### Requirement: Expense request intake MUST extract process creation data from SD text
The system MUST parse submitted Solicitação de Despesa text into canonical process creation context before creating a process. The parser MUST extract available SD fields and map them into the canonical English process model, including `processNumber`, `externalId` when available, `issuedAt`, nullable `procurementMethod`, nullable `biddingModality`, `object`, `justification`, responsible user resolution data when available, and structured items. The parser MUST return warnings for missing or ambiguous optional values instead of inventing data.

#### Scenario: Extracting process fields from SD text
- **WHEN** an authorized actor submits SD text containing prefeitura CNPJ, unidade orçamentária, request number, issue date, process type, classification/object, justification, item description, values, and responsible signer
- **THEN** the system extracts those fields into canonical process creation context and structured item data where possible

#### Scenario: Missing required process fields
- **WHEN** submitted SD text does not contain required process fields such as request number, issue date, object/classification, or justification
- **THEN** the system rejects the request before creating a process

#### Scenario: Missing optional SD fields
- **WHEN** submitted SD text omits optional values such as procurement method, bidding modality, item value, or source label
- **THEN** the system records an intake warning without fabricating the missing values

## ADDED Requirements

### Requirement: Expense request intake MUST create a scoped canonical process
The system MUST create a process from normalized SD context using the same canonical process model as native creation. The created process MUST link to the resolved organization and departments, MUST persist structured items when extracted, and MUST not expose raw submitted SD text or generic source metadata in the returned process profile.

#### Scenario: Successful SD-backed canonical process creation
- **WHEN** an authorized actor submits valid SD text that resolves to one organization and at least one department
- **THEN** the system creates a draft process with canonical process fields, department links, and structured items when available

#### Scenario: Duplicate SD-derived process number
- **WHEN** an actor submits SD text that derives a process number already used in the same organization
- **THEN** the system rejects the request with a conflict response

#### Scenario: Raw SD text is not returned
- **WHEN** the system returns the created process response
- **THEN** the response includes the canonical process profile without returning the raw submitted SD text

## REMOVED Requirements

### Requirement: Expense request intake MUST create a scoped process with source traceability
**Reason**: SD/PDF intake should feed the canonical process model instead of keeping a parallel source-traceability process shape based on `sourceMetadata`.

**Migration**: Convert known extracted SD fields, item data, and warnings into canonical process fields, structured items, and internal intake diagnostics as needed. Generated document context must read canonical process fields/items rather than public generic source metadata.

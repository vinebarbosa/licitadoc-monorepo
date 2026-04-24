## ADDED Requirements

### Requirement: Expense request intake MUST extract process creation data from SD text
The system MUST parse submitted Solicitação de Despesa text into normalized process creation context before creating a process. The parser MUST extract available SD fields and MUST return warnings for missing or ambiguous optional values instead of inventing data.

#### Scenario: Extracting process fields from SD text
- **WHEN** an authorized actor submits SD text containing prefeitura CNPJ, unidade orçamentária, request number, issue date, process type, classification/object, justification, item description, values, and responsible signer
- **THEN** the system extracts those fields into normalized process creation context

#### Scenario: Missing required process fields
- **WHEN** submitted SD text does not contain required process fields such as request number, issue date, process type, object/classification, or justification
- **THEN** the system rejects the request before creating a process

#### Scenario: Missing optional SD fields
- **WHEN** submitted SD text omits optional values such as item value or source label
- **THEN** the system records an intake warning without fabricating the missing values

### Requirement: Expense request intake MUST resolve scoped organization and department relationships from storage
The system MUST resolve the target organization and at least one target department from persisted records before creating an SD-backed process. Organization and department resolution MUST respect the authenticated actor's scope.

#### Scenario: Organization-scoped actor creates from matching SD CNPJ
- **WHEN** an `organization_owner` or `member` submits SD text whose CNPJ matches the actor's organization
- **THEN** the system uses the actor organization as the process organization

#### Scenario: Organization-scoped actor submits conflicting SD CNPJ
- **WHEN** an `organization_owner` or `member` submits SD text whose CNPJ belongs to another organization
- **THEN** the system rejects the request before creating a process

#### Scenario: Admin resolves organization from SD CNPJ
- **WHEN** an `admin` submits SD text with a CNPJ that matches exactly one stored organization and omits `organizationId`
- **THEN** the system creates the process inside the matched organization

#### Scenario: Department is resolved by budget unit code
- **WHEN** the SD contains a unidade orçamentária code that matches a stored department budget-unit code inside the resolved organization
- **THEN** the system links the created process to that department

#### Scenario: Department resolution is ambiguous
- **WHEN** the SD unidade orçamentária cannot be matched to exactly one department and no valid department override is supplied
- **THEN** the system rejects the request before creating a process

#### Scenario: Department override stays scoped
- **WHEN** the request supplies explicit department ids
- **THEN** the system validates that every supplied department belongs to the resolved process organization before creating links

### Requirement: Expense request intake MUST create a scoped process with source traceability
The system MUST create a process from normalized SD context using the existing process ownership model, linking it to the resolved organization and departments and preserving structured source traceability for later document generation.

#### Scenario: Successful SD-backed process creation
- **WHEN** an authorized actor submits valid SD text that resolves to one organization and at least one department
- **THEN** the system creates a draft process with extracted type, process number, external id, issue date, object, justification, responsible name, department links, and SD source metadata

#### Scenario: Duplicate SD-derived process number
- **WHEN** an actor submits SD text that derives a process number already used in the same organization
- **THEN** the system rejects the request with a conflict response

#### Scenario: Raw SD text is not returned
- **WHEN** the system returns the created process response
- **THEN** the response includes the process profile and source metadata without returning the raw submitted SD text

## ADDED Requirements

### Requirement: Organization create payloads MUST be parsed into the stored organization format before service persistence
The system MUST validate and parse organization create payloads at the request parsing boundary so the service layer receives the stored representation expected by the organizations domain.

#### Scenario: Create payload with formatted institutional fields
- **WHEN** an authenticated actor submits organization creation data with surrounding whitespace, a mixed-case slug, masked `cnpj`, masked `zipCode`, lowercase or mixed-case `state`, and mixed-case `institutionalEmail`
- **THEN** the parsed create payload trims required text fields, converts `slug` to lowercase kebab-case, preserves the submitted formatting of `phone`, `cnpj`, and `zipCode`, stores `state` as uppercase UF, and stores `institutionalEmail` in lowercase

#### Scenario: Create payload with empty optional links
- **WHEN** an authenticated actor submits `website` or `logoUrl` as empty strings or whitespace-only strings during organization creation
- **THEN** the parsed create payload converts those fields to `null`

### Requirement: Organization update payloads MUST parse only provided fields into the stored organization format
The system MUST validate and parse organization update payloads using the same field rules as create, while only transforming fields that are present in the request body.

#### Scenario: Partial update with formatted values
- **WHEN** an authenticated actor updates an organization with only `slug`, `cnpj`, `zipCode`, `state`, or `institutionalEmail` present and those values contain formatting or mixed case
- **THEN** the parsed update payload canonicalizes `slug`, `state`, and `institutionalEmail`, preserves the submitted formatting of `cnpj` and `zipCode`, and applies transformations only to the provided fields before the service persists them

#### Scenario: Partial update omits unrelated fields
- **WHEN** an authenticated actor sends a partial organization update that omits other editable fields
- **THEN** the parsed update payload leaves omitted fields undefined and does not inject defaults for them

### Requirement: Organization CNPJ conflicts MUST ignore formatting differences
The system MUST preserve the submitted `cnpj` representation in stored organization data, but MUST detect conflicts using the digits-only identity of the value.

#### Scenario: Create with equivalent CNPJ using different punctuation
- **WHEN** an authenticated actor creates an organization with a `cnpj` that matches an existing organization after removing formatting characters
- **THEN** the system rejects the request with a conflict response even if the stored `cnpj` strings are formatted differently

#### Scenario: Update with equivalent CNPJ using different punctuation
- **WHEN** an authenticated actor updates an organization to a `cnpj` that matches another stored organization after removing formatting characters
- **THEN** the system rejects the request with a conflict response even if the stored `cnpj` strings are formatted differently

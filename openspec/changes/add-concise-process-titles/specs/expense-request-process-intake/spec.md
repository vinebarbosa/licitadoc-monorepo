## MODIFIED Requirements

### Requirement: Expense request intake MUST create a scoped process with source traceability
The system MUST create a process from normalized SD context using the existing process ownership model, linking it to the resolved organization and departments, deriving a concise process `title`, and preserving structured source traceability for later document generation.

#### Scenario: Successful SD-backed process creation
- **WHEN** an authorized actor submits valid SD text that resolves to one organization and at least one department
- **THEN** the system creates a draft process with concise `title`, extracted type, process number, external id, issue date, full object, justification, responsible name, department links, and SD source metadata

#### Scenario: SD item description becomes the preferred concise title
- **WHEN** valid SD text contains a long object/classification and a shorter item description
- **THEN** the created process title is derived from the item description
- **AND** the process object remains the complete extracted object/classification text

#### Scenario: SD title falls back to shortened object
- **WHEN** valid SD text does not contain a usable item description
- **THEN** the created process title is derived from a concise version of the extracted object/classification

#### Scenario: Duplicate SD-derived process number
- **WHEN** an actor submits SD text that derives a process number already used in the same organization
- **THEN** the system rejects the request with a conflict response

#### Scenario: Raw SD text is not returned
- **WHEN** the system returns the created process response
- **THEN** the response includes the process profile and source metadata without returning the raw submitted SD text

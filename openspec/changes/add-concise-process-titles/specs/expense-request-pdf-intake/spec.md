## MODIFIED Requirements

### Requirement: Expense request PDF intake MUST reuse scoped process-creation rules after extraction
After extracting text from a stored SD PDF, the system MUST reuse the same organization-scope, department-resolution, concise-title derivation, and process-creation rules used by expense-request text intake. The created process MUST remain scoped to the resolved organization and MUST preserve PDF-source traceability.

#### Scenario: Uploaded PDF creates a scoped process
- **WHEN** an authorized actor uploads an SD PDF whose extracted content resolves to one allowed organization and at least one allowed department
- **THEN** the system creates the process inside that organization, assigns a concise process title, preserves the full extracted object, and links the PDF-source traceability to it

#### Scenario: Uploaded PDF resolves outside actor scope
- **WHEN** an `organization_owner` or `member` uploads an SD PDF whose extracted organization context conflicts with the actor's allowed organization scope
- **THEN** the system rejects the request and does not create a process

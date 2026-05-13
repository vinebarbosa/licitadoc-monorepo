## ADDED Requirements

### Requirement: Authenticated process creation MUST capture responsible as text
The authenticated process creation page MUST capture the process responsible as a required free-text string. The page MUST NOT require loading or selecting an application user to complete the responsible field.

#### Scenario: Organization-scoped user opens create page
- **WHEN** an organization-scoped actor opens `/app/processo/novo`
- **THEN** the responsible control is a text input and the page does not block process creation on `/api/users` access

#### Scenario: User submits responsible name
- **WHEN** the user types a responsible name and creates the process from the review step
- **THEN** the page submits the trimmed value as `responsibleName` in the canonical process creation payload

#### Scenario: Responsible name is missing
- **WHEN** the user attempts to advance without filling the responsible field
- **THEN** the page shows responsible-name validation in the form context

### Requirement: Authenticated process creation MUST keep organization and department data API-backed
The authenticated process creation page MUST continue using production API data for organizations and departments while removing the responsible-user list dependency from the process creation workflow.

#### Scenario: Reference data loads successfully
- **WHEN** the create page loads required production reference data
- **THEN** organization and department controls use API records and the responsible field remains user-entered text

#### Scenario: API rejects process creation
- **WHEN** the process creation API returns an error
- **THEN** the page keeps the user in the wizard and shows the API error in the form context

## ADDED Requirements

### Requirement: Authenticated process creation MUST use the validated demo UI
The authenticated process creation page MUST implement the same validated wizard structure, visual hierarchy, and item-editing interaction model as the public process creation demo page. Production-only adaptations MUST be limited to authenticated routing, API data loading, validation, and submission behavior.

#### Scenario: User opens the authenticated create page
- **WHEN** an authenticated actor opens `/app/processo/novo`
- **THEN** the page displays the demo-aligned process creation wizard with steps for process data, links, items, and review

#### Scenario: User edits simple and kit items
- **WHEN** the user adds simple items, kit items, and kit components in the authenticated creation page
- **THEN** the page preserves the demo item editing behavior while keeping structured item data ready for API submission

### Requirement: Authenticated process creation MUST load production reference data
The authenticated process creation page MUST replace demo sample organizations, departments, and users with API-backed reference data. The page MUST guide organization-scoped actors to their organization and MUST filter departments and responsible users by the selected or resolved organization.

#### Scenario: Reference data loads successfully
- **WHEN** the create page loads organizations, departments, and users from the API
- **THEN** organization, department, and responsible-user controls use the returned production records instead of hardcoded demo samples

#### Scenario: Organization-scoped actor creates a process
- **WHEN** an organization-scoped actor opens the page
- **THEN** the process organization is resolved from actor scope and selectable department/user options belong to that organization

### Requirement: Authenticated process creation MUST submit the canonical API payload
The authenticated process creation page MUST submit process creation through the process module API adapter using the canonical API payload. The submitted payload MUST include canonical process fields, selected department ids, selected responsible user id, and structured simple/kit items. The page MUST NOT submit demo-only summary data or legacy source metadata.

#### Scenario: User creates a process from the review step
- **WHEN** the user completes required fields and submits the review step
- **THEN** the page calls the process creation API with `procurementMethod`, `biddingModality`, `processNumber`, `externalId`, `issuedAt`, `responsibleUserId`, `title`, `object`, `justification`, `organizationId` when required, `departmentIds`, and structured `items`
- **AND** the page navigates to the created process detail after a successful response

#### Scenario: API rejects process creation
- **WHEN** the process creation API returns an error
- **THEN** the page keeps the user in the wizard and shows the API error in the form context

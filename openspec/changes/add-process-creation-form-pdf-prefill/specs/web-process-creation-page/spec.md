## ADDED Requirements

### Requirement: Process creation page MUST be available inside the authenticated app
The web app MUST expose a protected process creation page at `/app/processo/novo` inside the existing authenticated app shell. Existing new-process entrypoints from the processes listing and sidebar MUST navigate to this page.

#### Scenario: Authenticated actor opens the creation page
- **WHEN** an authenticated actor opens `/app/processo/novo`
- **THEN** the app renders the process creation page inside the authenticated app shell
- **THEN** the page provides breadcrumb context for process creation

#### Scenario: Unauthenticated actor opens the creation page
- **WHEN** an unauthenticated actor opens `/app/processo/novo`
- **THEN** the app applies the existing protected-route behavior instead of rendering the form

### Requirement: Process creation page MUST provide a complete editable form
The process creation page MUST allow the actor to review and edit all fields required to create a process through the existing manual process creation API. The form MUST include process type, process number, issue date, object, justification, responsible name, status/default, and at least one department. Admin actors MUST be able to choose the target organization; organization-scoped actors MUST use their session organization.

#### Scenario: User fills a process manually
- **WHEN** an authenticated actor enters valid process data and selects at least one allowed department
- **THEN** the form can be submitted with the corresponding `POST /api/processes/` payload

#### Scenario: Admin creates for a selected organization
- **WHEN** an authenticated admin opens the page
- **THEN** the page allows choosing an organization before creating the process
- **THEN** the submitted payload includes the selected `organizationId`

#### Scenario: Organization-scoped actor creates within session scope
- **WHEN** an authenticated `organization_owner` or `member` opens the page
- **THEN** the page does not require manual organization selection
- **THEN** the submitted payload omits `organizationId` unless it equals the actor organization

#### Scenario: Required form data is missing
- **WHEN** the actor attempts to submit without required fields or without department selection
- **THEN** the page prevents submission
- **THEN** the page identifies the fields that need correction

### Requirement: Process creation page MUST load reference data from existing APIs
The process creation page MUST load departments through the generated API client and MUST load organizations for admin actors through the generated API client. The page MUST render loading and error states for required reference data instead of allowing an invalid blind submission.

#### Scenario: Department data loads successfully
- **WHEN** the department query succeeds
- **THEN** the page presents departments as selectable options for the form

#### Scenario: Department data fails to load
- **WHEN** the department query fails
- **THEN** the page displays an error state with a retry affordance
- **THEN** the page prevents process submission until department options are available

#### Scenario: Admin organization data fails to load
- **WHEN** an admin opens the page and the organization query fails
- **THEN** the page displays an error state with a retry affordance
- **THEN** the page prevents process submission until organization options are available

### Requirement: Process creation page MUST import TopDown expense request PDFs for local prefill
The process creation page MUST allow the actor to import one PDF file representing a TopDown Solicitacao de Despesa. The browser MUST extract machine-readable text and derive process-field suggestions locally before any process is created.

#### Scenario: User imports a readable TopDown PDF
- **WHEN** the actor selects one readable TopDown Solicitacao de Despesa PDF
- **THEN** the browser extracts text from the PDF
- **THEN** the page pre-fills matching process form fields with extracted suggestions
- **THEN** the page keeps every pre-filled field editable

#### Scenario: Imported PDF has missing or ambiguous values
- **WHEN** the PDF extraction cannot identify optional or ambiguous values with confidence
- **THEN** the page keeps the form available
- **THEN** the page marks the affected values as requiring user review instead of inventing data

#### Scenario: Imported PDF cannot be read
- **WHEN** the selected file is not a PDF, is empty, encrypted, image-only, or lacks machine-readable text
- **THEN** the page reports that the PDF could not be read
- **THEN** the page does not create a process
- **THEN** the actor can continue filling the form manually

#### Scenario: User replaces an imported PDF
- **WHEN** the actor imports a second PDF before submitting
- **THEN** the page replaces the prior extraction result with the new result
- **THEN** the actor can review the updated form before submission

### Requirement: Process creation page MUST submit only reviewed process data
The process creation page MUST create a process only after the actor submits the reviewed form. Importing a PDF MUST NOT call a create-process endpoint by itself. On successful creation, the page MUST navigate away from the form or otherwise make the created process reachable.

#### Scenario: User submits reviewed PDF-prefilled data
- **WHEN** the actor imports a PDF, edits one or more pre-filled fields, and submits the form
- **THEN** the app sends the reviewed field values to `POST /api/processes/`
- **THEN** the created process reflects the reviewed values rather than unreviewed extraction output

#### Scenario: Backend rejects process creation
- **WHEN** the backend rejects the submitted process because of validation, scope, missing organization, foreign department, or duplicate process number
- **THEN** the page displays the backend error message in the form context
- **THEN** the actor can correct the form and submit again

#### Scenario: Process creation succeeds
- **WHEN** the backend returns a created process
- **THEN** the page invalidates process listing data
- **THEN** the app navigates to the created process route when available or back to the processes listing with a success indication

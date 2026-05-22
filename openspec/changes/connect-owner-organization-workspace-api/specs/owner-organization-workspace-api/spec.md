## ADDED Requirements

### Requirement: Owner organization workspace MUST load persisted workspace data
The system MUST render the validated owner organization workspace using persisted organization, member, invite, department, and institutional asset data instead of local mock records.

#### Scenario: Organization owner opens the workspace
- **WHEN** an authenticated `organization_owner` opens `/app/organizacao`
- **THEN** the workspace loads the current organization profile, members, invites, and departments from API-backed queries and renders the validated header, stats, tabs, and tab content.

#### Scenario: Workspace data is loading
- **WHEN** one or more workspace queries are pending
- **THEN** the workspace keeps the approved layout and shows non-disruptive loading states in the affected sections.

#### Scenario: Workspace data fails to load
- **WHEN** an API-backed workspace query fails
- **THEN** the affected section shows an actionable retry/error state without replacing unrelated loaded sections.

### Requirement: Owner organization workspace MUST persist prefeitura profile edits
The system MUST persist edits from the Dados da Prefeitura tab through the organization update API.

#### Scenario: Owner saves valid prefeitura data
- **WHEN** the owner edits organization fields and saves
- **THEN** the system sends the changed values to the organization update API, refreshes the organization query, and shows save feedback in the validated UI.

#### Scenario: Organization update is rejected
- **WHEN** the organization update API rejects the payload
- **THEN** the workspace keeps the edit form available and shows the returned error or a safe fallback message.

### Requirement: Owner organization workspace MUST manage members and invites through APIs
The system MUST back member listing, member removal, invite creation, invite cancellation, and invite resend actions with scoped API calls.

#### Scenario: Owner invites a member
- **WHEN** the owner submits a valid invite e-mail
- **THEN** the workspace creates the invite through the invite API, refreshes invite/member queries, and shows the new invite in the Convites section.

#### Scenario: Owner removes a member
- **WHEN** the owner confirms member removal
- **THEN** the workspace deletes the member through the user API and refreshes the member list.

#### Scenario: Owner cancels a pending invite
- **WHEN** the owner cancels a visible pending invite
- **THEN** the workspace revokes the invite through the invite API and refreshes the invite list.

#### Scenario: Owner resends a pending invite
- **WHEN** the owner resends a visible pending invite
- **THEN** the workspace calls the invite resend API, refreshes the invite list, and preserves the validated row layout.

### Requirement: Owner organization workspace MUST manage departments through APIs
The system MUST back department listing, creation, editing, and deletion with scoped department APIs.

#### Scenario: Owner creates a department
- **WHEN** the owner submits valid department data
- **THEN** the workspace creates the department through the department API and refreshes the department list.

#### Scenario: Owner edits a department
- **WHEN** the owner saves valid edits for an existing department
- **THEN** the workspace updates the department through the department API and refreshes the department list.

#### Scenario: Owner deletes a department
- **WHEN** the owner confirms department deletion
- **THEN** the workspace deletes the department through the department API and refreshes the department list.

### Requirement: Owner organization workspace MUST upload institutional assets through APIs
The system MUST upload logo, crest, and paper letterhead template files through organization asset APIs and reflect persisted asset URLs in the Documentos tab.

#### Scenario: Owner uploads logo
- **WHEN** the owner uploads a valid logo file
- **THEN** the workspace uploads it through the organization logo API, refreshes the organization data, and shows the persisted logo file state.

#### Scenario: Owner uploads crest
- **WHEN** the owner uploads a valid crest file
- **THEN** the workspace uploads it through the organization crest API, refreshes the organization data, and shows the persisted crest file state.

#### Scenario: Owner uploads paper letterhead template
- **WHEN** the owner uploads a valid paper letterhead template file
- **THEN** the workspace uploads it through the organization letterhead template API, refreshes the organization data, and shows the persisted template file state.

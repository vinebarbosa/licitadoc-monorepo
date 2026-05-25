## ADDED Requirements

### Requirement: Central displays prefeitura quick actions by role
The system MUST display organization-management quick actions on the Central de Trabalho only when the authenticated actor can use the linked prefeitura workflow.

#### Scenario: Organization owner sees prefeitura management shortcuts
- **WHEN** an authenticated actor with role `organization_owner` and an organization id opens the Central de Trabalho
- **THEN** the system shows the existing document quick actions and a prefeitura quick action group with links for prefeitura data, member invitations, departments, and institutional documents

#### Scenario: Member does not see owner-only shortcuts
- **WHEN** an authenticated actor with role `member` opens the Central de Trabalho
- **THEN** the system keeps the existing document quick actions visible and does not show owner-only links to `/app/organizacao`

#### Scenario: Admin does not see prefeitura shortcuts
- **WHEN** an authenticated actor with role `admin` opens the Central de Trabalho
- **THEN** the system keeps the current administrative work center behavior and does not show prefeitura organization-management quick actions

### Requirement: Prefeitura quick actions navigate directly to organization sections
The system MUST route each prefeitura quick action to the relevant authorized section of the existing organization workspace.

#### Scenario: Open member invitation action
- **WHEN** an organization owner selects the member invitation quick action from the Central de Trabalho
- **THEN** the system navigates to `/app/organizacao` with the members section active

#### Scenario: Open department action
- **WHEN** an organization owner selects the departments quick action from the Central de Trabalho
- **THEN** the system navigates to `/app/organizacao` with the departments section active

#### Scenario: Open institutional documents action
- **WHEN** an organization owner selects the institutional documents quick action from the Central de Trabalho
- **THEN** the system navigates to `/app/organizacao` with the institutional documents section active

#### Scenario: Open prefeitura data action
- **WHEN** an organization owner selects the prefeitura data quick action from the Central de Trabalho
- **THEN** the system navigates to `/app/organizacao` with the prefeitura data section active

### Requirement: Organization workspace accepts tab deep links
The system MUST support URL-addressable organization workspace tabs for every section targeted by Central de Trabalho quick actions.

#### Scenario: Valid tab query activates matching section
- **WHEN** an organization owner opens `/app/organizacao?tab=departamentos`
- **THEN** the organization workspace renders the departments section as the active tab

#### Scenario: Invalid tab query falls back safely
- **WHEN** an organization owner opens `/app/organizacao?tab=desconhecida`
- **THEN** the organization workspace renders the default prefeitura data section as the active tab without an error

#### Scenario: Tab changes update the addressable state
- **WHEN** an organization owner changes the active organization workspace tab
- **THEN** the system updates the current URL tab state so refresh and direct navigation preserve the selected section

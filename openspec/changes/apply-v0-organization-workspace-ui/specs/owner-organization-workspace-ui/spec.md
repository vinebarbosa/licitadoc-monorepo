## ADDED Requirements

### Requirement: Owner organization workspace renders the v0 main content
The system MUST render the v0 `/organizacao` main workspace content inside the owner organization page, excluding the v0 sidebar.

#### Scenario: Owner opens organization workspace
- **WHEN** an organization owner opens `/app/organizacao`
- **THEN** the page shows the organization identity header, active status badge, summary metadata, quick stats, and tab navigation matching the v0 `/organizacao` main content with the completude block removed

#### Scenario: Workspace uses local demo data
- **WHEN** the workspace renders before API integration
- **THEN** the organization, member, invite, department, and document sections are populated from local mock data and local state instead of backend requests

### Requirement: Organization workspace tabs expose v0 management sections
The system MUST expose the same tabbed management sections from the v0 main content.

#### Scenario: Owner changes tabs
- **WHEN** the owner selects Dados da Prefeitura, Membros & Convites, Departamentos, or Documentos
- **THEN** the corresponding v0 section renders without navigating away from the page

#### Scenario: Owner edits prefeitura data locally
- **WHEN** the owner edits and saves prefeitura data in the Dados da Prefeitura tab
- **THEN** the visible data updates locally and shows the v0 save feedback without calling the API

#### Scenario: Owner manages members and invites locally
- **WHEN** the owner searches, filters, invites, removes a non-owner member, resends an invite, or cancels an invite
- **THEN** the Membros & Convites tab updates local UI state and preserves the v0 table and invite list layout

#### Scenario: Owner manages departments locally
- **WHEN** the owner creates, edits, or deletes a department
- **THEN** the Departamentos tab updates local UI state, requires responsible data, and preserves the v0 department form and card layout

#### Scenario: Owner previews document uploads locally
- **WHEN** the owner uploads a logo, crest, or letterhead file
- **THEN** the Documentos tab shows the v0 upload preview, replace, download, remove, and success states without sending the file to an API

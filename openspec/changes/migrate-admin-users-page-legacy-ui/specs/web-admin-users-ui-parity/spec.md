## ADDED Requirements

### Requirement: Admin users page preserves the legacy operational layout while using current product data
The admin users page at `/admin/usuarios` MUST reproduce the operational structure validated in `/tmp/usuarios.tsx` while rendering current product data, including the administrative header, summary cards, compact filters, tabular user rows, row actions, and pagination area.

#### Scenario: Admin opens the page with available user data
- **WHEN** an authenticated `admin` opens `/admin/usuarios` and the current query returns users
- **THEN** the page renders the same information architecture expected from `/tmp/usuarios.tsx`
- **THEN** the page shows summary cards, filter controls, and a table of persisted users with identity, organization, role, created-at, and row-level administrative actions

#### Scenario: Legacy layout is preserved during loading and empty states
- **WHEN** the page is loading data or the active filters return no visible users
- **THEN** the interface keeps the same administrative layout structure with loading placeholders or an empty-state presentation
- **THEN** the system does not fall back to mock rows, placeholder copy unrelated to the workflow, or a blank page shell

### Requirement: Admin users page keeps filter and pagination behavior aligned with the current route state
The admin users page MUST preserve URL-driven filter and pagination behavior while presenting those controls with the same compact interaction model expected by the legacy screen.

#### Scenario: Admin changes filters from the migrated page
- **WHEN** an authenticated `admin` changes search text, role filter, organization filter, or pagination controls on `/admin/usuarios`
- **THEN** the page updates the route state accordingly
- **THEN** the system requests the corresponding real user listing instead of filtering mock data locally

#### Scenario: Admin restores the page from a shared URL
- **WHEN** an authenticated `admin` opens `/admin/usuarios` with existing query parameters for filters or page
- **THEN** the migrated controls restore those values from the URL
- **THEN** the table, summary area, and pagination reflect the restored listing state

### Requirement: Legacy administrative affordances stay wired to the current supported workflows
The migrated admin users page MUST preserve the legacy call-to-action and row-level affordances while executing only the current supported administrative workflows.

#### Scenario: Admin starts provisioning a new organization owner from the primary action
- **WHEN** an authenticated `admin` uses the primary provisioning action on the page
- **THEN** the system opens the administrative flow for creating an `organization_owner` invite
- **THEN** the page does not create a stored user directly outside the invite workflow

#### Scenario: Admin uses row-level management actions from the migrated table
- **WHEN** an authenticated `admin` opens the actions menu for a user row
- **THEN** the page offers compact management affordances for inspection, allowed edits, and removal
- **THEN** each action uses the current supported user-management behavior backed by real application data
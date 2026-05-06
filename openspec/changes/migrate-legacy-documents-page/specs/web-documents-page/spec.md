## ADDED Requirements

### Requirement: Authenticated actors MUST access the migrated documents page from the protected app shell
The system MUST expose `/app/documentos` inside the authenticated app shell and render the validated documents page layout from `tmp/documentos.tsx` without redesigning its header, summary cards, filters, table structure, badges, icons, and row action affordances.

#### Scenario: Actor opens the documents page
- **WHEN** an authenticated actor navigates to `/app/documentos`
- **THEN** the system renders the migrated documents page with the validated heading, summary cards, filters, table, and primary `Novo Documento` action using real backend data

### Requirement: The documents page MUST honor the existing type deep links and interactive filters
The system MUST read the `tipo` query parameter used by the app sidebar to initialize the type filter on `/app/documentos`. The page MUST also allow the actor to refine the visible rows by text search and status/type controls without mutating the underlying document records.

#### Scenario: Sidebar deep link opens the filtered documents page
- **WHEN** an authenticated actor navigates to `/app/documentos?tipo=tr`
- **THEN** the system opens the migrated page with the `TR` filter applied and only matching rows visible

#### Scenario: Actor refines the visible rows from the page controls
- **WHEN** an authenticated actor enters a search term or changes the status/type filters on `/app/documentos`
- **THEN** the system updates the visible rows and summary context to reflect only the matching documents while preserving the validated table layout

### Requirement: The documents page MUST preserve stable navigation and explicit non-destructive feedback for row actions
The system MUST render the validated row actions for viewing related processes and documents. Actions that do not yet have a complete workflow behind them MUST provide explicit non-destructive feedback instead of silently mutating or deleting a document.

#### Scenario: Actor uses stable navigation from a document row
- **WHEN** an authenticated actor activates a process or document link from a row on `/app/documentos`
- **THEN** the system navigates to the corresponding stable route for that process or document

#### Scenario: Actor triggers an unsupported row action
- **WHEN** an authenticated actor selects a row action whose full workflow is not implemented yet
- **THEN** the system keeps the actor on the documents page and shows explicit feedback that the action is not available yet

### Requirement: The documents page MUST handle loading, empty, and error states
The system MUST render clear loading, empty, and failure states for `/app/documentos` without breaking the protected-route flow or leaving the actor without recovery guidance.

#### Scenario: Documents are still loading
- **WHEN** the documents query for `/app/documentos` is still pending
- **THEN** the system renders a loading state for the page until the response resolves

#### Scenario: No documents match the current filters
- **WHEN** the documents query resolves successfully but no rows match the current page filters
- **THEN** the system renders an empty state in the page content area and keeps the filters available for adjustment

#### Scenario: Documents cannot be loaded
- **WHEN** the documents query for `/app/documentos` fails
- **THEN** the system renders an error state with a recovery action such as retrying the request or returning to a stable route
## ADDED Requirements

### Requirement: Authenticated actors MUST access the migrated new-document page from the protected shell
The system MUST expose `/app/documento/novo` inside the authenticated app shell and render the validated layout from `tmp/documento-novo.tsx` without redesigning its header, type cards, process selector, editable name field, and primary actions.

#### Scenario: Actor opens the new-document page
- **WHEN** an authenticated actor navigates to `/app/documento/novo`
- **THEN** the system renders the migrated `Novo Documento` page inside the protected shell using real application data instead of local mocks

### Requirement: The new-document page MUST honor deep links and derive the initial document name from real process data
The system MUST read `tipo` and `processo` query parameters on `/app/documento/novo` to initialize the selected document type and linked process when those values are valid for the authenticated actor. The page MUST derive the initial suggested name from the selected type and the selected process number while still allowing the actor to edit that value before submission.

#### Scenario: Deep link preselects type and process
- **WHEN** an authenticated actor opens `/app/documento/novo?tipo=tr&processo=process-1` and `process-1` is visible to that actor
- **THEN** the page preselects the `TR` type, selects `process-1`, and suggests a default name derived from the selected type and process number

#### Scenario: Actor changes type or process from the form
- **WHEN** an authenticated actor changes the selected document type or process before editing the name manually
- **THEN** the page updates the suggested document name to match the current type and process context without submitting the form

### Requirement: The new-document page MUST create documents through the real backend flow
The system MUST submit the migrated form through the real document-creation contract, preserve actor scoping, show submission progress, and navigate to a stable post-create destination using the created document id instead of a simulated placeholder id.

#### Scenario: Actor creates a document successfully
- **WHEN** an authenticated actor submits a valid `Novo Documento` form
- **THEN** the system creates the document through the backend contract and navigates using the real created document identifier to the configured stable destination for that document flow

#### Scenario: Document creation fails
- **WHEN** an authenticated actor submits the form and the creation request fails
- **THEN** the page keeps the actor on `/app/documento/novo`, preserves the entered values, and shows explicit error feedback without fabricating a created document

### Requirement: The new-document page MUST handle real process availability states
The system MUST handle the process picker's loading, empty, and invalid-deep-link states without breaking the validated page structure.

#### Scenario: Processes are still loading
- **WHEN** the page is waiting for the visible process list to load
- **THEN** the system keeps the form in a non-submittable loading state until the picker data resolves

#### Scenario: Deep link references a process outside current visibility
- **WHEN** an authenticated actor opens `/app/documento/novo` with a `processo` query parameter that does not resolve within the actor's visible processes
- **THEN** the page does not auto-select that process and still allows the actor to choose a valid visible process manually

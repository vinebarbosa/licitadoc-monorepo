## ADDED Requirements

### Requirement: Home page resume work MUST show recent contracting processes
The authenticated home page MUST render "Continuar de onde parei" as process-based resume cards sourced from the authenticated user's visible process listing data. The section MUST NOT render local mocked in-progress document cards when real process listing data is available.

#### Scenario: User views resume cards with process data
- **WHEN** an authenticated user opens `/app` and the process listing returns visible process items
- **THEN** the "Continuar de onde parei" section displays recent contracting process cards
- **AND** each card displays the process identifier, a concise process title or object, latest activity text, document progress, and a continuation action

#### Scenario: Resume action opens the process
- **WHEN** a user activates "Continuar" on a resume card
- **THEN** the app navigates to that process detail route

### Requirement: Home page process progress MUST come from generated document completion
The authenticated home page MUST calculate each resume card's percentage from the process document summary for the expected document types `dfd`, `etp`, `tr`, and `minuta`. Each completed expected document type MUST contribute 25 percentage points when the expected total is four.

#### Scenario: Process has two completed generated document types
- **WHEN** a listed process has `documents.completedCount = 2` and `documents.totalRequiredCount = 4`
- **THEN** its resume card displays 50% progress
- **AND** the progress bar exposes an accessible progress value of 50

#### Scenario: Process has all generated document types complete
- **WHEN** a listed process has `documents.completedCount = 4` and `documents.totalRequiredCount = 4`
- **THEN** its resume card displays 100% progress

#### Scenario: Process has no completed generated document types
- **WHEN** a listed process has `documents.completedCount = 0` and `documents.totalRequiredCount = 4`
- **THEN** its resume card displays 0% progress

### Requirement: Home page resume work MUST handle process list states honestly
The authenticated home page MUST align the resume section with the process list request state instead of keeping stale mock cards.

#### Scenario: Process listing is loading
- **WHEN** the process listing request is pending
- **THEN** the "Continuar de onde parei" section displays a loading state for resume cards
- **AND** it does not render mocked document titles

#### Scenario: Process listing returns no visible processes
- **WHEN** the process listing request succeeds with no process items
- **THEN** the "Continuar de onde parei" section displays an empty state appropriate for process resumption
- **AND** it does not render mocked document titles

#### Scenario: Process listing fails
- **WHEN** the process listing request fails
- **THEN** the "Continuar de onde parei" section displays an error or unavailable state without mocked cards

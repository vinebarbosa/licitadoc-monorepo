## ADDED Requirements

### Requirement: Processos sidebar badge MUST use the process listing total
The app shell MUST display the Processos navigation badge from the latest successful actor-scoped process listing `total`. The badge MUST NOT use a hardcoded, seeded, or otherwise mock process count.

#### Scenario: Successful count response
- **WHEN** an authenticated user opens an app-shell route and the process listing response has `total` equal to `7`
- **THEN** the Processos sidebar badge displays `7`

#### Scenario: Empty process listing
- **WHEN** an authenticated user opens an app-shell route and the process listing response has `total` equal to `0`
- **THEN** the Processos sidebar badge displays `0`
- **AND** the sidebar does not display any mock process count such as `5`

### Requirement: Processos sidebar badge MUST avoid unavailable or failed counts
The app shell MUST avoid showing a Processos count when the process count request has not produced a successful numeric `total`.

#### Scenario: Count is loading
- **WHEN** the Processos count request is still loading
- **THEN** the Processos sidebar item renders without a numeric badge

#### Scenario: Count request fails
- **WHEN** the Processos count request fails
- **THEN** the Processos sidebar item renders without a numeric badge
- **AND** the sidebar does not display a fallback mock count

### Requirement: Processos sidebar counter MUST reuse frontend process API boundaries
The Processos sidebar counter MUST consume process listing data through the frontend process module API boundary backed by `@licitadoc/api-client`.

#### Scenario: Sidebar needs the process count
- **WHEN** the app shell renders the Processos counter
- **THEN** it requests only the minimal process listing data needed to read `total`
- **AND** it does not add a raw fetch call or a new backend endpoint for the count

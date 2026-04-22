# api-maintainer-docs Specification

## Purpose
TBD - created by archiving change add-api-agents-and-architecture-docs. Update Purpose after archive.
## Requirements
### Requirement: API package MUST expose an agent-facing operational guide
The system MUST include `apps/api/agents.md` as a practical guide for contributors and coding agents working in the backend package.

#### Scenario: Contributor needs to perform a backend change safely
- **WHEN** a contributor or agent opens `apps/api/agents.md` before editing the API package
- **THEN** the document explains the package purpose, the key local commands, and the expected workflow for making and validating changes
- **AND** the document identifies where to place route, schema, business logic, database, and test changes inside `apps/api`

### Requirement: API package MUST expose a current-state architecture guide
The system MUST include `apps/api/architecture.md` as a readable map of how the API is structured and how requests flow through the current implementation.

#### Scenario: Contributor needs to understand the backend structure
- **WHEN** a contributor or agent opens `apps/api/architecture.md`
- **THEN** the document describes the app bootstrap path, plugin responsibilities, route-module structure, shared auth and error layers, database boundaries, OpenAPI generation, and test layout
- **AND** the document helps the reader identify the primary extension points for adding or changing backend behavior

### Requirement: API maintainer docs MUST reference real source anchors
The system MUST keep the new API guides grounded in the codebase by referencing the canonical files and folders that implement the documented behavior.

#### Scenario: Reader follows a documented backend boundary
- **WHEN** `apps/api/agents.md` or `apps/api/architecture.md` describes a runtime flow, module boundary, or maintenance workflow
- **THEN** the document points to the relevant current source locations in `apps/api`
- **AND** the guidance reflects the code structure that exists at the time the docs are added instead of a future or aspirational design

### Requirement: API maintainer docs MUST remain package-local and easy to discover
The system MUST place the new guides within `apps/api` and keep them discoverable enough for contributors who start from that package or from the repository root documentation.

#### Scenario: Contributor looks for API-specific maintenance guidance
- **WHEN** a contributor navigates into `apps/api` or reads the repository documentation for the backend
- **THEN** the contributor can find the API-specific operational and architecture guides without searching through unrelated packages


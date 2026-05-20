## ADDED Requirements

### Requirement: Contract generation command
The repository SHALL provide a local command that regenerates the API OpenAPI document and the generated API client in dependency order.

#### Scenario: Developer regenerates contracts
- **WHEN** a developer runs the contract generation command from the repository root
- **THEN** the command regenerates the API OpenAPI artifact before regenerating the `@licitadoc/api-client` package

### Requirement: Local pre-push guard
The repository SHALL provide a local pre-push guard that checks generated API contract artifacts before code is pushed.

#### Scenario: Generated artifacts are current
- **WHEN** the pre-push guard runs and contract generation produces no uncommitted changes in the tracked generated artifacts
- **THEN** the push is allowed to continue

#### Scenario: Generated artifacts are stale
- **WHEN** the pre-push guard runs and contract generation changes the tracked generated artifacts
- **THEN** the push is blocked and the developer is instructed to commit the regenerated artifacts

### Requirement: No remote CI enforcement
The repository SHALL keep API client synchronization enforcement local-only for this change.

#### Scenario: Remote pipeline remains unchanged
- **WHEN** this change is implemented
- **THEN** no GitHub Actions or Vercel CI step is added solely to run the API client synchronization guard

### Requirement: Hook setup documentation
The repository SHALL document how to install, run, and intentionally bypass the local pre-push guard.

#### Scenario: Developer sets up the guard
- **WHEN** a developer reads the repository documentation for generated API contracts
- **THEN** the documentation identifies the setup command, the manual verification command, and the standard Git bypass path for exceptional pushes

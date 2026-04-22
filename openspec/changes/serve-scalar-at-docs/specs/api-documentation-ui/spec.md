## ADDED Requirements

### Requirement: The API MUST serve Scalar at `/docs`
The API MUST expose an interactive Scalar documentation UI at `/docs` for the backend contract.

#### Scenario: Opening the documentation route
- **WHEN** a developer requests `GET /docs`
- **THEN** the API responds with the Scalar documentation interface

### Requirement: The Scalar UI MUST use the exported OpenAPI document
The documentation UI at `/docs` MUST load the API definition from the backend's exported OpenAPI document instead of a separate hand-maintained schema source.

#### Scenario: Loading the docs contract
- **WHEN** the Scalar UI initializes for `/docs`
- **THEN** it uses `/openapi.json` as the OpenAPI source for the rendered API reference

### Requirement: The docs UI MUST preserve merged API coverage
The documentation experience at `/docs` MUST continue to reflect the merged application and auth API coverage already exposed by the backend contract export.

#### Scenario: Viewing documented routes after the UI swap
- **WHEN** a developer browses the Scalar docs at `/docs`
- **THEN** the available endpoints reflect the same merged backend contract served by `/openapi.json`

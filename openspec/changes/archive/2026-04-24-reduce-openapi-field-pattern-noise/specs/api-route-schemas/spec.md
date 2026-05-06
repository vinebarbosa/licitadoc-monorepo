## ADDED Requirements

### Requirement: Application-owned field schemas MUST avoid regex-heavy documentation noise
The API MUST allow application-owned Zod-backed route contracts to expose documentation-friendly field schemas for common types so the exported OpenAPI document does not surface long raw regex patterns where concise type and example information are sufficient.

#### Scenario: Viewing a UUID field in Scalar
- **WHEN** a developer opens a request or response field such as `organizationId` in Scalar
- **THEN** the field documentation shows concise schema information with a readable example
- **AND** it does not rely on a long raw regex pattern as the primary visible cue for understanding the field

#### Scenario: Viewing an email field in Scalar
- **WHEN** a developer opens an email field in Scalar
- **THEN** the field documentation shows a concise email type with a readable example
- **AND** it avoids exposing a long raw regex pattern as the main field presentation detail

### Requirement: Documentation-friendly field schemas MUST remain compatible with the exported contract
The API MUST preserve compatibility of `/openapi.json` and the generated client workflow after simplifying application-owned field schemas for documentation readability.

#### Scenario: Regenerating the typed client after simplifying field schemas
- **WHEN** the client generation workflow reads the API's `/openapi.json` after the schema simplification
- **THEN** it can still generate typed models, client functions, and hooks for the application routes without requiring a separate hand-maintained schema source

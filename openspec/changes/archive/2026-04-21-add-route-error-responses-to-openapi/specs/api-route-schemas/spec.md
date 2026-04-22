## ADDED Requirements

### Requirement: Application-owned route contracts MUST declare relevant error responses
The API MUST allow application-owned Zod-backed route schemas to document relevant error responses in addition to successful responses so the exported OpenAPI contract reflects the main failure outcomes of each endpoint.

#### Scenario: Declaring success and failure responses for a protected route
- **WHEN** a developer defines a route schema for an application-owned endpoint in `apps/api`
- **THEN** the `response` contract can include both successful status codes and the relevant error status codes for that route
- **AND** the route does not need to document error statuses that cannot occur for that endpoint

### Requirement: Declared route error responses MUST align with the normalized backend error envelopes
The API MUST document error responses from reusable Zod-backed schemas that match the normalized payloads currently emitted by the global error handling layer.

#### Scenario: Documenting validation, application, and internal failures
- **WHEN** a route schema declares documented error responses
- **THEN** validation failures use the documented validation-error envelope
- **AND** application failures such as `bad_request`, `unauthorized`, `forbidden`, `not_found`, and `conflict` use documented application-error envelopes consistent with the shared error classes
- **AND** unexpected failures use the documented internal-server-error envelope

### Requirement: Exported OpenAPI MUST include declared error responses without breaking downstream consumption
The API MUST continue to export an OpenAPI document that includes the declared route error responses while remaining consumable by the existing client-generation workflow.

#### Scenario: Regenerating contracts after adding error responses
- **WHEN** the API exports or serves `/openapi.json` after routes declare shared error responses
- **THEN** the document includes those error responses in the affected route contracts
- **AND** the existing client-generation workflow can still consume the exported document

## ADDED Requirements

### Requirement: Application routes use Zod-defined HTTP schemas
The API MUST define application-owned route contracts from Zod schemas instead of manually authored JSON Schema objects. The same Zod-based definitions MUST be used for route inputs and declared responses.

#### Scenario: Defining route params and responses
- **WHEN** a developer declares the schema for an application route in `apps/api`
- **THEN** the route contract is authored from Zod schemas for structures such as `params`, `querystring`, `body`, and `response`

### Requirement: Route inputs are validated from Zod schemas
The API MUST validate incoming route inputs against the Zod schemas associated with the route before handler logic is allowed to proceed.

#### Scenario: Rejecting invalid route params
- **WHEN** a request contains params, query values, or a body that do not satisfy the route's Zod schema
- **THEN** the API rejects the request with a validation error instead of executing the business handler with invalid input

### Requirement: OpenAPI is derived from Zod-backed route contracts
The API MUST continue to expose an OpenAPI document for application-owned routes after the migration, and that document MUST be derived from the Zod-backed route schemas.

#### Scenario: Exporting the API contract
- **WHEN** the API exports or serves `/openapi.json`
- **THEN** the document includes the application routes described from the Zod-backed schemas

### Requirement: Generated clients remain compatible with the exported OpenAPI document
The OpenAPI document produced from Zod-backed route schemas MUST remain consumable by the existing client-generation workflow in `packages/api-client`.

#### Scenario: Regenerating the typed client
- **WHEN** the client generation workflow reads the API's `/openapi.json`
- **THEN** it can generate typed models, client functions, and React Query hooks for the application routes without requiring a separate hand-maintained schema source

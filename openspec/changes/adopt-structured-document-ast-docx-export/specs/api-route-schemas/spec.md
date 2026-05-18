## ADDED Requirements

### Requirement: Document DOCX export route MUST be represented in API contracts
The API MUST define the protected document DOCX export route through application-owned route schema metadata so the exported OpenAPI document describes the route, parameters, successful DOCX response, and relevant error responses.

#### Scenario: Export route appears in OpenAPI
- **WHEN** the API exports or serves `/openapi.json`
- **THEN** the document includes the protected DOCX export route for document resources

#### Scenario: Export route declares relevant errors
- **WHEN** the DOCX export route is documented
- **THEN** the route contract declares relevant errors such as unauthorized, forbidden, not found, bad request, and internal server error

### Requirement: Structured document fields MUST use Zod-backed schemas
Any public API fields or request bodies that expose structured document content MUST be described through reusable Zod-backed schemas rather than handwritten unvalidated JSON objects.

#### Scenario: Document detail exposes structured content
- **WHEN** a document detail response includes structured AST content or structured-content metadata
- **THEN** those fields are declared through Zod-backed schemas in the route contract

#### Scenario: Document update accepts structured projection data
- **WHEN** a document update route accepts editor JSON or structured document content
- **THEN** the accepted body schema validates the supported structure before handler logic proceeds

### Requirement: Binary DOCX response MUST remain compatible with client generation
The exported OpenAPI contract MUST describe DOCX export in a way that remains consumable by the existing API client generation workflow, even if the web app uses a manual blob download helper for the binary response.

#### Scenario: Client generation succeeds after export route is added
- **WHEN** the client generation workflow reads the API's `/openapi.json` after the DOCX route is added
- **THEN** it can generate or preserve typed client artifacts without requiring a separate hand-maintained schema source

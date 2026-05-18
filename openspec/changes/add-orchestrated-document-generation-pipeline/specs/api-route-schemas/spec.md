## ADDED Requirements

### Requirement: Document-generation route schemas MUST expose pipeline fields through Zod-backed contracts
The API MUST describe any document-generation pipeline request or response fields through application-owned Zod schemas. The exported OpenAPI document MUST be derived from those schemas and MUST remain consumable by the existing generated client workflow.

#### Scenario: Debug request field is documented
- **WHEN** the document-generation create route supports an optional debug flag or pipeline-debug selector
- **THEN** the route body schema declares that field with Zod
- **AND** the exported OpenAPI contract documents it as optional so existing clients remain compatible

#### Scenario: Pipeline debug response is documented
- **WHEN** a debug-enabled document-generation response can include pipeline trace data
- **THEN** the route response schema declares the debug payload with Zod-backed schemas
- **AND** default successful responses remain valid for callers that do not request debug output

#### Scenario: Generated clients consume updated contract
- **WHEN** the API contract is regenerated after the document-generation schemas change
- **THEN** the generated client workflow can consume `/openapi.json` without manual schema edits
- **AND** existing create-document request payloads remain valid

### Requirement: OpenAPI export MUST include canonical pipeline schemas when public
The API MUST include public pipeline-related DTO schemas in the exported OpenAPI document when those DTOs can appear in request or response bodies. Internal-only stage schemas MUST remain internal unless they are deliberately exposed through an authenticated route response.

#### Scenario: Public debug DTO appears in OpenAPI
- **WHEN** an authenticated debug response includes fields such as extracted facts, enriched context, document plan, review result, rewrite attempts, or final pipeline status
- **THEN** the exported OpenAPI contract includes schemas for those fields
- **AND** their examples distinguish zero-value absence from valid monetary estimates

#### Scenario: Internal provider payloads are not exposed accidentally
- **WHEN** the pipeline uses internal provider prompts, raw provider responses, or provider error payloads
- **THEN** those internal structures are not documented as public OpenAPI schemas unless a route intentionally returns them

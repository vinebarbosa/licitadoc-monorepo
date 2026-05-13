## ADDED Requirements

### Requirement: Production pages MUST adapt validated demo UI through module boundaries
When a public demo page is identified as the validated product UI for an authenticated workflow, the production module page MUST preserve that validated UI structure while moving production API access, routing, and state integration into the owning module. The implementation MUST use module-level API adapters over generated client contracts and MUST avoid duplicating hardcoded demo data in authenticated pages.

#### Scenario: Demo UI graduates into an authenticated module page
- **WHEN** a validated public demo page is implemented as an authenticated product workflow
- **THEN** the authenticated page keeps the demo layout and interaction model
- **AND** the authenticated page replaces demo sample data with module API adapters and generated API-client types

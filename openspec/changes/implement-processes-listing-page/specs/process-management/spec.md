## MODIFIED Requirements

### Requirement: Process listings MUST be paginated and scoped by actor visibility
The system MUST return paginated process listings from persisted data and MUST scope those listings according to the authenticated actor's permissions. `admin` actors MUST be able to list processes across organizations. `organization_owner` and `member` actors MUST be able to list only processes whose `organizationId` matches the actor's `organizationId`. Non-admin actors without an `organizationId` MUST receive an empty paginated response.

Process listings MUST accept optional `search`, `status`, and `type` filters. `search` MUST match at least `processNumber`, nullable `externalId`, `object`, and `responsibleName`. `status` and `type` MUST filter by the persisted process fields.

Each listed process item MUST include the process profile fields already exposed by listings and MUST also expose a document progress summary for the expected document types `dfd`, `etp`, `tr`, and `minuta`. The summary MUST include `completedCount`, `totalRequiredCount`, `completedTypes`, and `missingTypes`. A document type MUST count as completed only when the process has at least one related document with that expected `type` and `status = completed`.

Each listed process item MUST expose an activity timestamp for table ordering/display that represents the most recent update between the process itself and its related documents when related document data is available.

#### Scenario: Admin lists all processes
- **WHEN** an authenticated `admin` requests the process listing
- **THEN** the system returns a paginated list of stored processes across organizations

#### Scenario: Organization-scoped actor lists only own organization processes
- **WHEN** an authenticated `organization_owner` or `member` requests the process listing
- **THEN** the system returns only processes whose `organizationId` matches the actor's `organizationId`

#### Scenario: Non-admin actor without organization scope receives an empty page
- **WHEN** an authenticated non-admin actor without `organizationId` requests the process listing
- **THEN** the system returns an empty paginated response

#### Scenario: Listing filters by search text
- **WHEN** an authenticated actor requests the process listing with a `search` value matching a visible process number, external id, object, or responsible name
- **THEN** the system returns only visible processes matching the search value within the paginated response

#### Scenario: Listing filters by status and type
- **WHEN** an authenticated actor requests the process listing with `status` or `type` filters
- **THEN** the system returns only visible processes whose persisted fields match the submitted filters

#### Scenario: Listing returns document progress by expected document type
- **WHEN** a visible process has completed documents for `dfd` and `etp`, a failed `tr`, and no `minuta`
- **THEN** the listed item returns `documents.totalRequiredCount` as `4`
- **THEN** the listed item returns `documents.completedCount` as `2`
- **THEN** the listed item includes `dfd` and `etp` in `documents.completedTypes`
- **THEN** the listed item includes `tr` and `minuta` in `documents.missingTypes`

#### Scenario: Listing activity timestamp includes related document updates
- **WHEN** a visible process has a related document updated after the process `updatedAt`
- **THEN** the listed item exposes an activity timestamp using the document update time for table display

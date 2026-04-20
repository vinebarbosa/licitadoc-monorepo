## ADDED Requirements

### Requirement: Invite collection routes accept page-based pagination
The system MUST allow invite collection routes to receive `page` and `pageSize` query parameters and MUST normalize those values before querying the data source.

#### Scenario: Listing invites with explicit pagination
- **WHEN** an authenticated actor requests the invite listing with `page` and `pageSize`
- **THEN** the system applies those normalized values to the invite query while preserving the actor's visibility scope

#### Scenario: Listing invites without pagination params
- **WHEN** an authenticated actor requests the invite listing without `page` or `pageSize`
- **THEN** the system uses the default pagination values defined by the shared pagination helper

### Requirement: Invite listings return pagination metadata
The system MUST return paginated invite collections with enough metadata for clients to navigate pages deterministically.

#### Scenario: Returning a paginated invite response
- **WHEN** the system returns a page of invites
- **THEN** the payload includes `items`, `page`, `pageSize`, `total`, and `totalPages`

#### Scenario: Reporting totals within actor scope
- **WHEN** an `organization_owner` requests the invite listing
- **THEN** the `total` and `totalPages` values reflect only invites visible within that actor's organization scope

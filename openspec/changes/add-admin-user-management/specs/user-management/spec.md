## ADDED Requirements

### Requirement: User listings support administrative filters within actor scope
The system MUST allow user listings to be filtered by search term, role, and organization while preserving the authenticated actor's visibility scope and paginated response contract.

#### Scenario: Admin filters users by search term and role
- **WHEN** an authenticated `admin` requests the user listing with a search term and a role filter
- **THEN** the system returns only users in the admin's visible scope whose `name` or `email` matches the term case-insensitively and whose role matches the requested role

#### Scenario: Admin filters users by organization
- **WHEN** an authenticated `admin` requests the user listing with an `organizationId` filter
- **THEN** the system returns only users in that organization and preserves pagination metadata for the filtered result

#### Scenario: Organization owner cannot widen scope with organization filters
- **WHEN** an authenticated `organization_owner` requests the user listing with an `organizationId` different from the actor's own organization
- **THEN** the system does not expand visibility beyond the actor's organization scope
- **THEN** the returned users remain limited to the actor's managed organization
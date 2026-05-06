## MODIFIED Requirements

### Requirement: User listings are backed by stored users and respect actor scope
The system MUST return paginated user listings from persisted `users` data and MUST scope those listings according to the authenticated actor's administrative permissions. When a role filter is supplied, the system MUST include matching users regardless of onboarding status unless the request specifies a narrower status filter.

#### Scenario: Admin lists all users
- **WHEN** an authenticated `admin` requests the user listing
- **THEN** the system returns a paginated list of stored users across organizations

#### Scenario: Organization owner lists only users from the same organization
- **WHEN** an authenticated `organization_owner` requests the user listing
- **THEN** the system returns only users whose `organizationId` matches the actor's organization

#### Scenario: Organization owner lists pending invited members
- **WHEN** an authenticated `organization_owner` requests users with role `member`
- **THEN** the system returns same-organization `member` users with `onboardingStatus` equal to `pending_profile`
- **AND** the system returns same-organization `member` users with `onboardingStatus` equal to `complete`

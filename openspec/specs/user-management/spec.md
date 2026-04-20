## ADDED Requirements

### Requirement: User listings are backed by stored users and respect actor scope
The system MUST return paginated user listings from persisted `users` data and MUST scope those listings according to the authenticated actor's administrative permissions.

#### Scenario: Admin lists all users
- **WHEN** an authenticated `admin` requests the user listing
- **THEN** the system returns a paginated list of stored users across organizations

#### Scenario: Organization owner lists only users from the same organization
- **WHEN** an authenticated `organization_owner` requests the user listing
- **THEN** the system returns only users whose `organizationId` matches the actor's organization

### Requirement: User detail reads are scoped by administrative visibility
The system MUST allow only actors with visibility over a target user to read that user's detail.

#### Scenario: Admin reads any user
- **WHEN** an authenticated `admin` requests a user by id
- **THEN** the system returns the persisted detail for that user

#### Scenario: Organization owner reads a user from another organization
- **WHEN** an authenticated `organization_owner` requests a user whose `organizationId` differs from the actor's organization
- **THEN** the system rejects the request

### Requirement: Administrative user updates enforce role-based management rules
The system MUST allow administrative updates only when the actor is permitted to manage the target user and the requested changes keep role and organization data consistent.

#### Scenario: Admin updates role and organization
- **WHEN** an authenticated `admin` updates a user's permitted management fields
- **THEN** the system persists the updated user data and returns the updated user

#### Scenario: Organization owner updates a member in the same organization
- **WHEN** an authenticated `organization_owner` updates a `member` user from the same organization within allowed fields
- **THEN** the system persists the update

#### Scenario: Organization owner attempts to update a privileged user
- **WHEN** an authenticated `organization_owner` attempts to update an `admin` or `organization_owner`
- **THEN** the system rejects the request

### Requirement: Administrative user deletion is scoped and removes the target user
The system MUST allow administrative deletion only within the actor's management scope and MUST remove the target user when authorized.

#### Scenario: Admin deletes a user
- **WHEN** an authenticated `admin` deletes a target user
- **THEN** the system removes that user and returns a successful deletion response

#### Scenario: Organization owner deletes a member from the same organization
- **WHEN** an authenticated `organization_owner` deletes a `member` from the same organization
- **THEN** the system removes that user and returns a successful deletion response

#### Scenario: Organization owner attempts to delete a user outside allowed scope
- **WHEN** an authenticated `organization_owner` attempts to delete a user from another organization or with a more privileged role
- **THEN** the system rejects the request

## ADDED Requirements

### Requirement: Privileged actors can revoke visible pending invites
The system MUST allow privileged actors to revoke pending invites within their invite visibility scope.

#### Scenario: Organization owner revokes own organization invite
- **WHEN** an authenticated `organization_owner` revokes a pending invite whose `organizationId` matches the actor's organization
- **THEN** the system marks the invite as `revoked`, prevents future acceptance of that invite, and returns the updated invite

#### Scenario: Admin revokes visible invite
- **WHEN** an authenticated `admin` revokes a pending invite
- **THEN** the system marks the invite as `revoked`, prevents future acceptance of that invite, and returns the updated invite

#### Scenario: Actor revokes an invite outside scope
- **WHEN** an actor attempts to revoke an invite they cannot list or manage
- **THEN** the system rejects the request

#### Scenario: Actor revokes a spent invite
- **WHEN** an actor attempts to revoke an accepted or already revoked invite
- **THEN** the system rejects the request and leaves the invite unchanged

### Requirement: Privileged actors can resend visible pending invites
The system MUST allow privileged actors to resend pending invites within their invite visibility scope.

#### Scenario: Organization owner resends own organization invite
- **WHEN** an authenticated `organization_owner` resends a pending invite whose `organizationId` matches the actor's organization
- **THEN** the system rotates the invite token and expiration, redelivers the invite e-mail, and returns the updated invite metadata

#### Scenario: Admin resends visible invite
- **WHEN** an authenticated `admin` resends a pending invite
- **THEN** the system rotates the invite token and expiration, redelivers the invite e-mail, and returns the updated invite metadata

#### Scenario: Actor resends an invite outside scope
- **WHEN** an actor attempts to resend an invite they cannot list or manage
- **THEN** the system rejects the request

#### Scenario: Actor resends a spent invite
- **WHEN** an actor attempts to resend an accepted or revoked invite
- **THEN** the system rejects the request and leaves the invite unchanged

## ADDED Requirements

### Requirement: Privileged actors can create role-scoped invites
The system MUST allow only `admin` and `organization_owner` users to create invites, and it MUST persist the target role according to the inviter's role.

#### Scenario: Admin creates an organization owner invite
- **WHEN** an authenticated `admin` creates an invite for an e-mail address and optionally provides an `organizationId`
- **THEN** the system creates a pending invite with role `organization_owner`, stores the provided organization when present, and records the inviter as the author

#### Scenario: Organization owner creates a member invite
- **WHEN** an authenticated `organization_owner` creates an invite for an e-mail address
- **THEN** the system creates a pending invite with role `member` and stores the inviter's `organizationId` on the invite

#### Scenario: Unauthorized actor attempts to create an invite
- **WHEN** an unauthenticated actor or a `member` attempts to create an invite
- **THEN** the system rejects the request and does not create an invite

### Requirement: Invite records preserve approved provisioning context
The system MUST persist the invitation data needed to provision the invited user exactly as approved and to track the invite lifecycle.

#### Scenario: Saving a pending invite
- **WHEN** the system stores a new invite
- **THEN** the invite record includes the normalized target e-mail, target role, organization reference when applicable, inviter reference, redeem token reference, lifecycle status, and expiration metadata

#### Scenario: Listing visible invites
- **WHEN** an authenticated `admin` or `organization_owner` requests invites within their scope
- **THEN** the system returns only the invites visible to that actor together with their current lifecycle status

### Requirement: Accepting an invite applies the stored role and organization
The system MUST apply the role and organization stored in a valid pending invite to the user account that accepts it.

#### Scenario: Authenticated user accepts a matching invite
- **WHEN** an authenticated user whose e-mail matches the invite accepts a valid pending invite
- **THEN** the system marks the invite as accepted and updates the user record with the invite's stored role and `organizationId`

#### Scenario: Invite without organization keeps the user unassigned
- **WHEN** a valid pending invite is accepted and the invite has no `organizationId`
- **THEN** the system applies the stored role and keeps the user without an organization assignment

### Requirement: Invalid or spent invites are rejected safely
The system MUST reject invite redemption when the invite is invalid, expired, already consumed, or belongs to a different e-mail.

#### Scenario: Expired or non-pending invite
- **WHEN** a user attempts to accept an invite whose status is not `pending` or whose expiration is in the past
- **THEN** the system refuses the redemption and leaves both invite and user data unchanged

#### Scenario: E-mail mismatch during acceptance
- **WHEN** the authenticated user's e-mail differs from the e-mail stored on the invite
- **THEN** the system rejects the acceptance and does not apply the invite's role or organization

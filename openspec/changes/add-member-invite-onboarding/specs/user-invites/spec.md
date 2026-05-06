## ADDED Requirements

### Requirement: Owner member invites provision temporary credentials
The system MUST provision an invited `member` user with a temporary password and MUST send the system link and temporary password to the invited e-mail address.

#### Scenario: Organization owner member invite sends temporary credentials
- **WHEN** an authenticated `organization_owner` creates an invite for a member e-mail address
- **THEN** the system creates or reuses the pending invite lifecycle record for that e-mail
- **AND** provisions a user with role `member`, the inviter's `organizationId`, onboarding status `pending_profile`, and a temporary e-mail/password credential
- **AND** sends an e-mail to the invited address containing the system sign-in link and temporary password

#### Scenario: Member invite conflicts with existing user
- **WHEN** an authenticated `organization_owner` invites an e-mail address that already belongs to a non-pending user
- **THEN** the system rejects the invite and does not rotate or disclose credentials for that user

#### Scenario: Temporary password is not persisted in plaintext
- **WHEN** the system provisions a temporary password for a member invite
- **THEN** the plaintext password is only available for the outbound e-mail message
- **AND** stored credentials contain only the password hash and temporary-password metadata

## MODIFIED Requirements

### Requirement: Privileged actors can create role-scoped invites
The system MUST allow only `admin` and `organization_owner` users to create invites, and it MUST persist the target role according to the inviter's role.

#### Scenario: Admin creates an organization owner invite
- **WHEN** an authenticated `admin` creates an invite for an e-mail address and optionally provides an `organizationId`
- **THEN** the system creates a pending invite with role `organization_owner`, stores the provided organization when present, and records the inviter as the author

#### Scenario: Organization owner creates a member invite
- **WHEN** an authenticated `organization_owner` creates an invite for an e-mail address
- **THEN** the system creates a pending invite with role `member`, stores the inviter's `organizationId` on the invite, and starts the invited member first-login onboarding flow

#### Scenario: Unauthorized actor attempts to create an invite
- **WHEN** an unauthenticated actor or a `member` attempts to create an invite
- **THEN** the system rejects the request and does not create an invite

### Requirement: Invite records preserve approved provisioning context
The system MUST persist the invitation data needed to provision the invited user exactly as approved and to track the invite lifecycle.

#### Scenario: Saving a pending invite
- **WHEN** the system stores a new invite
- **THEN** the invite record includes the normalized target e-mail, target role, organization reference when applicable, inviter reference, redeem token reference, lifecycle status, expiration metadata, and the provisioned user reference when one exists

#### Scenario: Listing visible invites
- **WHEN** an authenticated `admin` or `organization_owner` requests invites within their scope
- **THEN** the system returns only the invites visible to that actor together with their current lifecycle and onboarding status

### Requirement: Accepting an invite applies the stored role and organization
The system MUST apply the role and organization stored in a valid pending invite only for invites that still use token redemption; provisioned member invites MUST be completed through temporary-password sign-in and first-login onboarding.

#### Scenario: Authenticated user accepts a matching token-based invite
- **WHEN** an authenticated user whose e-mail matches a valid pending invite that still uses token redemption accepts that invite
- **THEN** the system marks the invite as accepted and updates the user record with the invite's stored role and `organizationId`

#### Scenario: Provisioned member invite is not completed through token acceptance
- **WHEN** an authenticated user attempts to accept a provisioned member invite through the token acceptance endpoint
- **THEN** the system rejects the token acceptance path and leaves the invited member onboarding state unchanged
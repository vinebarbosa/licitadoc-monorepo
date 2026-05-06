## ADDED Requirements

### Requirement: Admin owner invites provision temporary credentials
The system MUST provision an invited `organization_owner` user with a temporary password and MUST send the system link and temporary password to the invited e-mail address.

#### Scenario: Admin owner invite sends temporary credentials
- **WHEN** an authenticated `admin` creates an invite for an organization-owner e-mail address
- **THEN** the system creates or reuses the pending invite lifecycle record for that e-mail
- **AND** provisions a user with role `organization_owner`, no `organizationId`, onboarding status `pending_profile`, and a temporary e-mail/password credential
- **AND** sends an e-mail to the invited address containing the system sign-in link and temporary password

#### Scenario: Owner invite conflicts with existing user
- **WHEN** an authenticated `admin` invites an e-mail address that already belongs to a non-pending user
- **THEN** the system rejects the invite and does not rotate or disclose credentials for that user

#### Scenario: Temporary password is not persisted in plaintext
- **WHEN** the system provisions a temporary password for an owner invite
- **THEN** the plaintext password is only available for the outbound e-mail message
- **AND** stored credentials contain only the password hash and temporary-password metadata

## MODIFIED Requirements

### Requirement: Privileged actors can create role-scoped invites
The system MUST allow only `admin` and `organization_owner` users to create invites, and it MUST persist the target role according to the inviter's role.

#### Scenario: Admin creates an organization owner invite
- **WHEN** an authenticated `admin` creates an invite for an e-mail address
- **THEN** the system creates a pending invite with role `organization_owner`, records the inviter as the author, and starts the invited owner onboarding flow without assigning an organization yet

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
- **THEN** the invite record includes the normalized target e-mail, target role, organization reference when applicable, inviter reference, lifecycle status, expiration metadata, and the provisioned user reference when one exists

#### Scenario: Listing visible invites
- **WHEN** an authenticated `admin` or `organization_owner` requests invites within their scope
- **THEN** the system returns only the invites visible to that actor together with their current lifecycle and onboarding status

### Requirement: Accepting an invite applies the stored role and organization
The system MUST apply the role and organization stored in a valid pending invite only for invites that still use token redemption; admin-created organization-owner onboarding invites MUST be completed through temporary-password sign-in and onboarding.

#### Scenario: Authenticated user accepts a matching member invite
- **WHEN** an authenticated user whose e-mail matches a valid pending member invite accepts that invite
- **THEN** the system marks the invite as accepted and updates the user record with role `member` and the invite's `organizationId`

#### Scenario: Organization owner invite is not completed through token acceptance
- **WHEN** an authenticated user attempts to accept an admin-created organization-owner onboarding invite through the token acceptance endpoint
- **THEN** the system rejects the token acceptance path and leaves the invited owner onboarding state unchanged

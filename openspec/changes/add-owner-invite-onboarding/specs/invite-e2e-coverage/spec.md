## MODIFIED Requirements

### Requirement: Invite E2E coverage MUST verify privileged invite creation and scoped listing over real HTTP
The system MUST include API end-to-end tests that create invites through the real invite routes using authenticated sessions and verify that list responses reflect the inviter's authorized scope.

#### Scenario: Admin creates an organization-owner invite and sees it in the list
- **WHEN** an E2E test authenticates as an `admin`, creates an owner invite for an e-mail address, and then requests the invite list
- **THEN** the create response contains a pending invite with role `organization_owner`
- **AND** a pending `organization_owner` user is provisioned with no `organizationId` and onboarding status `pending_profile`
- **AND** the list response includes that invite in the admin-visible results

#### Scenario: Organization owner creates a member invite scoped to their organization
- **WHEN** an E2E test authenticates as an `organization_owner`, creates a member invite, and then requests the invite list
- **THEN** the created invite is stored with role `member` and the inviter's `organizationId`
- **AND** the list response includes only invites visible inside that organization scope

### Requirement: Invite E2E coverage MUST verify token preview and acceptance over real HTTP
The system MUST include API end-to-end tests that preview and redeem token-based member invites while asserting the invited user's stored access context.

#### Scenario: Newly created member invite token can be previewed
- **WHEN** an E2E test calls the invite preview endpoint with a token returned by a newly created member invite
- **THEN** the API returns the pending invite metadata for that token, including its expiration state

#### Scenario: Matching authenticated user accepts a member invite and receives the stored role and organization
- **WHEN** an E2E test authenticates as the user whose e-mail matches a valid pending member invite and posts to the accept endpoint
- **THEN** the invite is marked as accepted
- **AND** the invited user's stored role and `organizationId` match the accepted member invite

## ADDED Requirements

### Requirement: Invite E2E coverage MUST verify invited owner onboarding transitions
The system MUST include API end-to-end coverage for owner invite provisioning, temporary credential sign-in, profile completion, organization creation, and final session state.

#### Scenario: Invited owner signs in and completes onboarding
- **WHEN** an E2E test creates an owner invite, signs in with the generated temporary credential, submits profile setup, and submits organization onboarding
- **THEN** the final session has role `organization_owner`, the created `organizationId`, and onboarding status `complete`

#### Scenario: Invited owner cannot skip profile setup
- **WHEN** an E2E test signs in as an invited owner whose onboarding status is `pending_profile` and attempts organization onboarding
- **THEN** the API rejects organization creation and leaves the user without an organization

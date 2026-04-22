## ADDED Requirements

### Requirement: Invite E2E coverage MUST verify privileged invite creation and scoped listing over real HTTP
The system MUST include API end-to-end tests that create invites through the real invite routes using authenticated sessions and verify that list responses reflect the inviter's authorized scope.

#### Scenario: Admin creates an organization-owner invite and sees it in the list
- **WHEN** an E2E test authenticates as an `admin`, creates an invite with an `organizationId`, and then requests the invite list
- **THEN** the create response contains a pending invite with role `organization_owner`
- **AND** the list response includes that invite in the admin-visible results

#### Scenario: Organization owner creates a member invite scoped to their organization
- **WHEN** an E2E test authenticates as an `organization_owner`, creates an invite, and then requests the invite list
- **THEN** the created invite is stored with role `member` and the inviter's `organizationId`
- **AND** the list response includes only invites visible inside that organization scope

### Requirement: Invite E2E coverage MUST verify token preview and acceptance over real HTTP
The system MUST include API end-to-end tests that preview an invite token and redeem it through the authenticated acceptance route while asserting the invited user's stored access context.

#### Scenario: Newly created invite token can be previewed
- **WHEN** an E2E test calls the invite preview endpoint with a token returned by a newly created invite
- **THEN** the API returns the pending invite metadata for that token, including its expiration state

#### Scenario: Matching authenticated user accepts an invite and receives the stored role and organization
- **WHEN** an E2E test authenticates as the user whose e-mail matches a valid pending invite and posts to the accept endpoint
- **THEN** the invite is marked as accepted
- **AND** the invited user's stored role and `organizationId` match the accepted invite

### Requirement: Invite E2E coverage MUST verify auth-dependent rejection paths
The system MUST include API end-to-end tests for invite failures that depend on HTTP authentication, actor role, or invite ownership.

#### Scenario: Unprivileged actor cannot create or list invites
- **WHEN** an E2E test calls the invite create or list endpoints without a privileged authenticated session
- **THEN** the API rejects the request
- **AND** no new invite is persisted

#### Scenario: Different authenticated e-mail cannot accept the invite
- **WHEN** an E2E test authenticates as a user whose e-mail differs from the invite target and attempts to accept that invite
- **THEN** the API rejects the acceptance request
- **AND** the invite remains pending with no role or organization changes applied to that user

### Requirement: Invite E2E coverage MUST run in an isolated and repeatable environment
The system MUST provide deterministic setup and cleanup for invite E2E scenarios so repeated local and CI runs do not depend on pre-existing invite, organization, or auth state.

#### Scenario: Invite E2E scenarios start from clean fixture state
- **WHEN** the invite E2E suite starts a scenario
- **THEN** it prepares or cleans the invite, organization, and auth records needed for the fixture users it exercises

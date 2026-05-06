## ADDED Requirements

### Requirement: Invite E2E coverage MUST verify provisioned member onboarding over real HTTP
The system MUST include API end-to-end tests that create owner-scoped member invites through the real invite routes, capture the temporary credential delivery, and verify first-login onboarding completion over the real auth and onboarding paths.

#### Scenario: Organization owner creates a provisioned member invite
- **WHEN** an E2E test authenticates as an `organization_owner` and creates a member invite through the real invite route
- **THEN** the create response contains a pending invite with role `member` and a provisioned user reference
- **AND** the deterministic mail provider captures the invited e-mail address, system sign-in link, and temporary password

#### Scenario: Invited member completes first-login onboarding
- **WHEN** an E2E test signs in with the temporary credentials from a provisioned member invite and submits the first-login onboarding step
- **THEN** the invited member's onboarding status moves from `pending_profile` to `complete`
- **AND** the member reaches the main app with the invite-linked organization still assigned

#### Scenario: Provisioned member invite cannot be completed through token acceptance
- **WHEN** an E2E test attempts to redeem a provisioned member invite through the token acceptance endpoint
- **THEN** the API rejects the acceptance request
- **AND** the invite remains pending until the invited member completes first-login onboarding
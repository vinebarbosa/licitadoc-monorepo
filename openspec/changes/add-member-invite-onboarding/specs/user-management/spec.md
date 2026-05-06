## ADDED Requirements

### Requirement: Provisioned invited users expose onboarding state through user context
The system MUST expose onboarding status for provisioned invited users through persisted user data and current-session-facing user context.

#### Scenario: Invited member signs in with temporary credentials
- **WHEN** a provisioned invited `member` authenticates successfully with temporary credentials
- **THEN** the returned user or session context includes role `member`, the invite-linked `organizationId`, and onboarding status `pending_profile`

#### Scenario: Member completes first-login onboarding
- **WHEN** an invited `member` completes the required profile and password replacement step
- **THEN** the persisted user data and session-facing context report onboarding status `complete`
- **AND** the member keeps the organization linked by the original invite
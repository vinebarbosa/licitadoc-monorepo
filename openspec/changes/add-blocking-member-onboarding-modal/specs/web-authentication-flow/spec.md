## ADDED Requirements

### Requirement: Authenticated member sessions MUST enforce first-access onboarding
The web authentication flow SHALL use session-visible onboarding status to prevent invited members in `pending_profile` from using authenticated app routes before completion.

#### Scenario: Pending member signs in successfully
- **WHEN** a provisioned invited `member` signs in with valid temporary credentials
- **THEN** the authenticated app session is established
- **AND** the first authenticated app view renders the blocking member onboarding modal

#### Scenario: Pending member navigates across protected routes
- **WHEN** an authenticated `member` with `onboardingStatus` equal to `pending_profile` changes authenticated routes before completing onboarding
- **THEN** the app keeps the blocking onboarding modal visible
- **AND** the app prevents interaction with each protected route behind the modal

#### Scenario: Member completes onboarding
- **WHEN** the member onboarding completion request succeeds and the session-visible user state becomes `complete`
- **THEN** the app removes the blocking modal
- **AND** the member can use protected app routes normally

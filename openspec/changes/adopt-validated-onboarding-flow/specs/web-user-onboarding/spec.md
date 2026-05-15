## ADDED Requirements

### Requirement: Pending users MUST complete onboarding through validated dedicated web pages
The web app MUST render the validated onboarding UI for authenticated users whose onboarding is incomplete, and MUST use a dedicated page flow for both `organization_owner` and `member` users instead of mixing page and modal experiences.

#### Scenario: Organization owner opens profile onboarding
- **WHEN** an authenticated `organization_owner` with `onboardingStatus` `pending_profile` opens the required onboarding route
- **THEN** the app renders the validated profile-completion page
- **AND** the page indicates that organization setup and completion remain ahead in the journey

#### Scenario: Member opens profile onboarding
- **WHEN** an authenticated `member` with `onboardingStatus` `pending_profile` opens the required onboarding route
- **THEN** the app renders the validated profile-completion page
- **AND** the page reflects a shorter journey that ends after profile completion
- **AND** the user does not depend on a blocking app-shell modal to complete onboarding

### Requirement: Organization owners MUST complete organization setup through the validated organization page
The web app MUST present the validated organization-setup page to `organization_owner` users whose first-login profile step is already complete and whose organization is still missing.

#### Scenario: Organization owner opens organization setup
- **WHEN** an authenticated `organization_owner` with `onboardingStatus` `pending_organization` opens the required onboarding route
- **THEN** the app renders the validated organization page
- **AND** the page groups the form into clear institutional, contact, and authority sections

#### Scenario: Organization owner completes organization setup
- **WHEN** an authenticated `organization_owner` successfully submits the validated organization page
- **THEN** the app advances the user to the onboarding completion handoff page

### Requirement: Onboarding completion MUST use a role-aware success handoff page
The web app MUST end onboarding with the validated completion page so users see what was completed and can enter the platform from an explicit success state.

#### Scenario: Member finishes onboarding
- **WHEN** an authenticated `member` completes the validated profile onboarding step
- **THEN** the app renders the validated completion page
- **AND** the page confirms the profile is ready and access is now available

#### Scenario: Organization owner finishes onboarding
- **WHEN** an authenticated `organization_owner` completes the validated organization onboarding step
- **THEN** the app renders the validated completion page
- **AND** the page confirms both profile and organization setup were completed

### Requirement: Public onboarding demo routes MUST remain available for visual validation
The web app MUST keep the onboarding demo routes available so the validated UI can still be reviewed in isolation after the real onboarding flow adopts it.

#### Scenario: Visitor opens onboarding demo pages
- **WHEN** a visitor navigates to the public onboarding demo profile, organization, or completion routes
- **THEN** the app renders the validated onboarding demo pages
- **AND** those routes stay isolated from authenticated onboarding state

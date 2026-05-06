## ADDED Requirements

### Requirement: Invited owners complete profile setup on the web
The web app MUST provide an authenticated owner onboarding screen where invited `organization_owner` users complete their profile and replace the temporary password.

#### Scenario: Pending profile owner opens onboarding
- **WHEN** an authenticated `organization_owner` with onboarding status `pending_profile` opens the owner onboarding flow
- **THEN** the app renders a form for name and new password
- **AND** successful submission moves the user to organization onboarding after session data is refreshed

#### Scenario: Profile form rejects incomplete input
- **WHEN** an invited owner submits profile onboarding without a valid name or acceptable new password
- **THEN** the app keeps the user on the profile step and shows validation feedback

### Requirement: Invited owners complete organization setup on the web
The web app MUST provide an organization onboarding screen where invited owners submit prefeitura data and enter the main app after successful creation.

#### Scenario: Pending organization owner creates prefeitura
- **WHEN** an authenticated `organization_owner` with onboarding status `pending_organization` submits valid prefeitura data
- **THEN** the app calls the organization onboarding contract
- **AND** refreshes session data so the user has the created `organizationId` and onboarding status `complete`
- **AND** navigates the user to `/app`

#### Scenario: Completed owner opens onboarding route
- **WHEN** an authenticated owner whose onboarding status is `complete` opens an owner onboarding route
- **THEN** the app redirects the user to `/app`

## ADDED Requirements

### Requirement: Invited members complete first-login profile setup on the web
The web app MUST provide an authenticated onboarding screen where invited `member` users complete their profile and replace the temporary password before entering the application.

#### Scenario: Pending profile member opens onboarding
- **WHEN** an authenticated `member` with onboarding status `pending_profile` opens the member onboarding flow
- **THEN** the app renders a form for name and new password
- **AND** successful submission refreshes the session context and navigates the user to `/app`

#### Scenario: Profile form rejects incomplete input
- **WHEN** an invited member submits onboarding without a valid name or acceptable new password
- **THEN** the app keeps the user on the onboarding step and shows validation feedback

### Requirement: Completed members are redirected away from member onboarding
The web app MUST prevent members who have already completed first-login setup from remaining on the onboarding route.

#### Scenario: Completed member opens onboarding route
- **WHEN** an authenticated `member` whose onboarding status is `complete` opens a member onboarding route
- **THEN** the app redirects the user to `/app`
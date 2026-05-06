## ADDED Requirements

### Requirement: Invited member onboarding MUST render as a blocking modal
The web app SHALL render a blocking onboarding modal for authenticated invited `member` users whose session-visible onboarding status is `pending_profile`.

#### Scenario: Pending member enters the app
- **WHEN** an authenticated `member` with `onboardingStatus` equal to `pending_profile` opens an authenticated app route
- **THEN** the app renders the member onboarding modal above the current app shell
- **AND** the app prevents interaction with the underlying route until onboarding is completed

#### Scenario: Completed member enters the app
- **WHEN** an authenticated `member` with `onboardingStatus` equal to `complete` opens an authenticated app route
- **THEN** the app renders the normal route content without the onboarding modal

### Requirement: Blocking modal MUST require name and new password
The member onboarding modal SHALL require the invited member to submit their name and a new password before continuing.

#### Scenario: Member submits valid onboarding form
- **WHEN** the pending member enters a valid name and valid new password in the modal and submits the form
- **THEN** the app calls the current-user onboarding completion API
- **AND** the modal closes only after the API confirms completion
- **AND** the member remains in or returns to the normal authenticated app flow

#### Scenario: Member submits invalid or incomplete form
- **WHEN** the pending member submits the modal with missing or invalid name or password data
- **THEN** the app keeps the modal open
- **AND** the app shows validation or API error feedback without allowing app usage behind the modal

### Requirement: Blocking modal MUST NOT be dismissible before completion
The member onboarding modal SHALL NOT provide any user action that dismisses it before successful onboarding completion.

#### Scenario: Member attempts to close the modal
- **WHEN** the pending member presses Escape, clicks outside the modal, or looks for a close action
- **THEN** the modal remains open
- **AND** no close button or skip action is available

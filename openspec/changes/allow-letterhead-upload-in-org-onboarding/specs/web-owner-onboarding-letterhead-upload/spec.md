## ADDED Requirements

### Requirement: Owner organization onboarding MUST allow optional letterhead upload
The web app MUST let invited organization owners attach or skip a prefeitura paper letterhead while completing organization onboarding.

#### Scenario: Pending organization owner opens organization onboarding
- **WHEN** an authenticated `organization_owner` with onboarding status `pending_organization` opens the organization onboarding screen
- **THEN** the app renders the prefeitura data form with an optional letterhead file control

#### Scenario: Owner selects a valid letterhead image
- **WHEN** the owner selects one valid PNG, JPEG, or WebP image in the letterhead control
- **THEN** the app shows the selected file state with a local preview or file summary and keeps the organization onboarding submission available

#### Scenario: Owner removes selected letterhead before submission
- **WHEN** the owner removes the selected letterhead file before submitting organization onboarding
- **THEN** the app clears the file state and submits the organization form without letterhead data

#### Scenario: Owner skips letterhead
- **WHEN** the owner submits valid prefeitura data without selecting a letterhead image
- **THEN** the app completes organization onboarding through the organization onboarding API and navigates the owner into the app after session data is refreshed

#### Scenario: Owner submits with letterhead
- **WHEN** the owner submits valid prefeitura data with one selected valid letterhead image
- **THEN** the app sends the organization fields and letterhead file to the organization onboarding API and navigates the owner into the app only after the API reports successful organization creation

#### Scenario: Selected letterhead is invalid
- **WHEN** the owner selects an unsupported, empty, too-large, or multiple-file letterhead input
- **THEN** the app prevents submission with that file state and shows validation feedback without clearing the rest of the organization form

#### Scenario: API rejects onboarding letterhead
- **WHEN** the organization onboarding API rejects the submitted letterhead file
- **THEN** the app keeps the owner on the organization onboarding screen, preserves typed prefeitura data where practical, and shows the API validation error

## ADDED Requirements

### Requirement: Organization owners MUST see same-organization members
The web app SHALL render members returned for the authenticated organization owner's organization on the members page.

#### Scenario: Owner opens members page with existing members
- **WHEN** an authenticated `organization_owner` opens the members page and the users API returns same-organization `member` users
- **THEN** the page renders those members in the members table
- **AND** the page does not render the empty members state

#### Scenario: Owner opens members page with pending invited member
- **WHEN** an authenticated `organization_owner` opens the members page and the users API returns a same-organization `member` with `onboardingStatus` equal to `pending_profile`
- **THEN** the page renders that member in the members table
- **AND** the member is not hidden because onboarding is incomplete

### Requirement: Member invite creation MUST refresh visible members
The web app SHALL refresh member list data after a successful organization-owner member invite creation.

#### Scenario: Owner invites member from empty members page
- **WHEN** the members page is showing an empty state and the owner submits a valid member invite
- **THEN** the app refreshes the members list query
- **AND** the newly provisioned member appears without requiring a full page reload

#### Scenario: Owner invites member while pending invites are visible
- **WHEN** the owner submits a valid member invite
- **THEN** the app refreshes the pending invites query
- **AND** the app refreshes the members query

### Requirement: Invite errors MUST NOT render misleading success feedback
The web app SHALL avoid showing a success message for member invite creation unless the response is a successful invite payload.

#### Scenario: Invite creation returns an error payload
- **WHEN** the invite mutation returns an error payload or a payload without an invite e-mail
- **THEN** the page keeps the invite dialog state safe
- **AND** the page shows error feedback instead of a success message containing `undefined`

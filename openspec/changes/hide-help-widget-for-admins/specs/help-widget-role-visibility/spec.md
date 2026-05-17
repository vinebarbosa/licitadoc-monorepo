## ADDED Requirements

### Requirement: Contextual help widget visibility follows authenticated role
The system SHALL render the contextual help widget for authenticated non-admin users and SHALL hide it for authenticated admin users inside the app shell.

#### Scenario: Member opens an app shell route
- **WHEN** an authenticated `member` opens a route rendered inside the app shell
- **THEN** the contextual help widget is rendered
- **AND** the user can open the help widget from the floating help control

#### Scenario: Organization owner opens an app shell route
- **WHEN** an authenticated `organization_owner` opens a route rendered inside the app shell
- **THEN** the contextual help widget is rendered
- **AND** the user can open the help widget from the floating help control

#### Scenario: Admin opens an app shell route
- **WHEN** an authenticated `admin` opens a route rendered inside the app shell
- **THEN** the contextual help widget is not rendered
- **AND** the admin remains able to access support work through the admin support ticket inbox

### Requirement: Public and unauthenticated routes do not gain the contextual help widget
The system SHALL keep contextual help widget mounting limited to authenticated app shell routes.

#### Scenario: User opens a route outside the app shell
- **WHEN** a user opens a public or unauthenticated route outside the app shell
- **THEN** the contextual help widget is not rendered

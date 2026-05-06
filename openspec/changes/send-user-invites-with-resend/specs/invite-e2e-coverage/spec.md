## ADDED Requirements

### Requirement: Invite E2E coverage MUST verify e-mail delivery through a deterministic provider
The system MUST include API end-to-end coverage proving that invite creation requests trigger e-mail delivery without depending on live Resend network calls.

#### Scenario: Invite creation captures an e-mail delivery request
- **WHEN** an E2E test creates an invite through the real HTTP route with the stub e-mail provider configured
- **THEN** the test can verify that the provider received the normalized invitee e-mail and invite URL

#### Scenario: Invite delivery failure returns a normalized server error
- **WHEN** an E2E test configures the e-mail provider to fail and creates an otherwise valid invite
- **THEN** the API responds with a normalized server error
- **AND** the error response does not include provider credentials or raw provider payloads

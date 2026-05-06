## ADDED Requirements

### Requirement: Created invites are delivered by e-mail
The system MUST send an invitation e-mail containing the invite URL when a privileged actor creates an invite successfully.

#### Scenario: Invite e-mail is sent after persistence
- **WHEN** an authenticated privileged actor creates a valid invite
- **THEN** the system persists the pending invite
- **AND** sends an e-mail to the normalized target e-mail address containing the invite URL returned by the API

#### Scenario: Invite e-mail delivery fails
- **WHEN** a pending invite is persisted but the configured e-mail provider fails to send the invite e-mail
- **THEN** the system returns a server error without exposing provider secrets
- **AND** the invite remains pending and redeemable through its generated token

### Requirement: Invite e-mail delivery is configurable
The system MUST allow invite e-mail delivery to run through Resend in configured environments and through a deterministic stub in local or test environments.

#### Scenario: Resend provider is configured
- **WHEN** invite e-mail delivery is configured to use Resend with an API key and sender address
- **THEN** the system sends invite e-mails through the Resend e-mail API using the configured sender

#### Scenario: Stub provider is configured
- **WHEN** invite e-mail delivery is configured to use the stub provider
- **THEN** the system accepts invite e-mail send requests without contacting external services

## ADDED Requirements

### Requirement: Invite e-mails are branded and actionable

The system MUST send invite e-mails with branded HTML content that clearly identifies LicitaDoc, explains the invite purpose, and presents the correct primary action for the invite type while retaining a plaintext fallback.

#### Scenario: Organization owner invite e-mail

- **WHEN** an organization-owner invite is delivered
- **THEN** the HTML e-mail includes LicitaDoc branding, the invite role, a clear accept-invite call to action targeting the invite URL, and the invite expiration context
- **AND** the plaintext fallback includes the same target URL and expiration context

#### Scenario: Provisioned member invite e-mail

- **WHEN** a provisioned member invite with a temporary password is delivered
- **THEN** the HTML e-mail includes LicitaDoc branding, a sign-in call to action targeting the sign-in URL when present, temporary password guidance, first-access guidance, and the invite expiration context
- **AND** the plaintext fallback includes the same sign-in or invite URL, temporary password, first-access guidance, and expiration context

### Requirement: Invite e-mail rendering preserves delivery semantics

The system MUST render invite e-mail HTML before handing the payload to the configured mail provider without changing recipient, subject intent, Resend idempotency, or tracking tags.

#### Scenario: Resend invite payload

- **WHEN** the Resend invite mailer sends an invite e-mail
- **THEN** the request payload includes the rendered branded HTML, plaintext fallback, original recipient, invite category tag, invite id tag, and idempotency key derived from the invite id

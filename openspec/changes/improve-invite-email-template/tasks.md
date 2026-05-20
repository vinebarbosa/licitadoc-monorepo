## 1. Template Foundation

- [x] 1.1 Decide and install the minimal React Email rendering dependencies compatible with the API Node 24 build, or document the local-renderer fallback if React Email is not adopted.
- [x] 1.2 Add an invite e-mail template module that renders branded HTML from `InviteEmailInput`.
- [x] 1.3 Add an e-mail-safe LicitaDoc logo or brand fallback with accessible alt/text branding.

## 2. Mailer Integration

- [x] 2.1 Replace the handwritten invite HTML generation in `ResendInviteMailer` with the new template renderer.
- [x] 2.2 Preserve the existing plaintext fallback, subject intent, recipient, Resend idempotency key, and Resend tracking tags.
- [x] 2.3 Keep `StubInviteMailer` behavior unchanged for tests and local flows.

## 3. Coverage

- [x] 3.1 Add or update tests for organization-owner invite e-mail HTML content and plaintext fallback.
- [x] 3.2 Add or update tests for provisioned member invite e-mail content with sign-in URL, temporary password, and first-access guidance.
- [x] 3.3 Add or update tests proving the Resend payload keeps the existing delivery semantics.

## 4. Verification

- [x] 4.1 Run focused API invite/e-mail tests.
- [x] 4.2 Run the API typecheck or build path affected by the new template dependency.

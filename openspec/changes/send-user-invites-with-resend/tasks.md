## 1. Mailer Configuration

- [x] 1.1 Extend API environment parsing and examples with invite e-mail provider, Resend API key, and sender address settings.
- [x] 1.2 Add a Fastify mailer plugin with stub and Resend implementations behind a narrow invite e-mail interface.

## 2. Invite Delivery

- [x] 2.1 Update invite creation to send an invitation e-mail after persisting the pending invite.
- [x] 2.2 Register the mailer in app startup and wire the invite route to the configured mailer.
- [x] 2.3 Ensure delivery failures return a normalized server error and do not expose provider secrets.

## 3. Verification

- [x] 3.1 Add unit tests for successful invite e-mail delivery and delivery failure behavior.
- [x] 3.2 Update invite E2E tests to assert stub e-mail delivery and normalized failure responses.
- [x] 3.3 Run focused API tests and typecheck for the affected package.

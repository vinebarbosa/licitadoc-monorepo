## Context

The API already creates invite records, returns the raw token once, and builds an `inviteUrl` from server configuration. The web admin users page calls this endpoint today, but success only means the invite was persisted; the invited person still needs the link by some out-of-band path.

Resend's current API accepts `POST /emails` at `https://api.resend.com` with Bearer authentication, sender, recipient, subject, and `html` or `text` body. Direct HTTP keeps the implementation small and avoids adding another package for a single transactional message.

## Goals / Non-Goals

**Goals:**
- Send an e-mail containing the invite URL whenever invite creation succeeds.
- Keep invite persistence and token handling unchanged.
- Hide Resend behind a small mailer interface so tests can use a deterministic stub.
- Configure provider choice, API key, and sender through environment variables.
- Surface delivery failures as normalized server errors without leaking API keys or raw provider payloads.

**Non-Goals:**
- Add bulk invite delivery, retry queues, webhooks, or delivery status tracking.
- Add a new web acceptance route.
- Store Resend message IDs in the invite table.
- Hardcode production secrets or sender domains in source.

## Decisions

- Add a mailer plugin/decorator to the API app.
  - Rationale: route handlers can depend on `app.mailer` the same way they depend on `app.db` and `app.config`, while business logic can accept a narrow `sendInviteEmail` dependency for unit tests.
  - Alternative considered: call Resend directly from `createInvite`; rejected because it couples persistence logic to the provider and makes failure-path tests brittle.

- Use direct Resend REST calls through `fetch`.
  - Rationale: Node's runtime already provides `fetch`, and Resend documents the stable REST base URL, Bearer auth, required `User-Agent`, and `/emails` endpoint.
  - Alternative considered: add the Resend SDK; rejected for now because the app only needs one send operation and no React e-mail rendering.

- Make `INVITE_EMAIL_PROVIDER=stub` the default and `resend` the opt-in provider.
  - Rationale: local development and E2E tests should keep creating invites without external network access or secrets. Production can set `INVITE_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`.
  - Alternative considered: auto-enable Resend when `RESEND_API_KEY` exists; rejected because a missing or unverified sender would turn local invite creation into an external failure unexpectedly.

- Send after the invite row is inserted.
  - Rationale: Resend needs the tokenized URL generated from the stored invite. If delivery fails, the API returns an error while leaving the persisted pending invite available for audit or future resend work.
  - Alternative considered: send before insert; rejected because no durable invite exists yet and the token cannot be redeemed safely.

## Risks / Trade-offs

- Resend outage after persistence -> The endpoint returns a server error and logs provider context without secrets; the pending invite remains in the database.
- Sender domain misconfiguration -> Startup or first send fails clearly when `resend` is selected without required config, and `.env.example` documents the settings.
- Duplicate e-mail on client retry -> Keep existing duplicate pending invite protection; Resend idempotency can use the invite id as the `Idempotency-Key`.
- E2E network flakiness -> Tests use the stub provider and assert captured delivery, not the real Resend API.

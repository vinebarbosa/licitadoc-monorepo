## Why

Invite e-mails are currently assembled as minimal string-concatenated HTML, which makes them look plain and increases the chance of inconsistent styling as invite flows evolve. A polished branded e-mail improves first impressions for invited users and gives us a safer foundation for future transactional messages.

## What Changes

- Replace the current handwritten invite HTML with a reusable branded e-mail template.
- Evaluate/adopt a transactional e-mail rendering approach such as React Email for component-based markup that still outputs static HTML for Resend.
- Include LicitaDoc branding in the message header, using the system logo/brand mark in an e-mail-client-safe format.
- Preserve current invite behavior: same recipient, subject intent, invite/sign-in target URLs, temporary password handling, text fallback, Resend tags, and idempotency key.
- Add focused coverage for both organization-owner invites and provisioned member invites so the rendered e-mail contains the expected CTA, credentials guidance, expiration context, and brand elements.

## Capabilities

### New Capabilities

### Modified Capabilities

- `user-invites`: Invite delivery must produce a branded, accessible HTML e-mail while preserving the existing plaintext fallback and invite semantics.

## Impact

- Affected API code: `apps/api/src/shared/email/invite-mailer.ts` and likely new template/helper modules under `apps/api/src/shared/email`.
- Affected tests: invite mailer/unit tests and existing invite creation tests that assert delivery payloads.
- Potential dependencies: React Email rendering packages, subject to confirming the smallest compatible package set for Node 24 and the current API build.
- Assets/configuration: a system logo or brand mark must be available as a stable public URL, embedded-safe asset, or e-mail-safe textual/logo fallback.

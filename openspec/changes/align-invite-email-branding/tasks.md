## 1. Template Branding

- [x] 1.1 Replace the current `LD` brand mark in `apps/api/src/shared/email/invite-email-template.ts` with an e-mail-local scale-icon logo treatment that matches the public landing page.
- [x] 1.2 Keep visible "LicitaDoc" text and accessible logo labeling in the e-mail header.
- [x] 1.3 Add or update light palette constants derived from the app's light design-system tokens for page, card, text, muted text, border, primary, primary foreground, and tinted surfaces.
- [x] 1.4 Apply explicit light inline styles and light color-scheme metadata to the React Email output.

## 2. Behavior Preservation

- [x] 2.1 Preserve organization-owner invite copy, CTA target, role label, expiration context, plaintext fallback, Resend tags, and idempotency key.
- [x] 2.2 Preserve provisioned member sign-in CTA behavior, temporary password guidance, first-access guidance, role label, expiration context, plaintext fallback, Resend tags, and idempotency key.

## 3. Tests

- [x] 3.1 Update invite e-mail template tests to assert the landing-style scale logo semantics and absence of the old `LD` logo mark.
- [x] 3.2 Update tests to assert representative light palette styles and light color-scheme metadata in rendered HTML.
- [x] 3.3 Run the focused API invite e-mail tests.

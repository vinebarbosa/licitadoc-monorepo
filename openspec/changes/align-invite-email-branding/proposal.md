## Why

The current invite e-mail still presents a dark, isolated brand treatment that does not match the public landing page or the app's light design-system palette. This weakens first-impression consistency for invited users and makes the e-mail feel visually detached from LicitaDoc.

## What Changes

- Replace the invite e-mail brand mark with the same scale icon treatment used on the LicitaDoc landing page.
- Update the invite e-mail to render in light mode by default, using colors derived from the app's light design tokens for background, card, text, border, muted text, and primary action.
- Keep the existing invite semantics intact: recipient, role copy, CTA target, temporary-password guidance, expiration context, plaintext fallback, Resend payload behavior, tags, and idempotency key.
- Add focused tests that assert the rendered HTML uses the landing-page logo semantics and light palette rather than the old dark/`LD` visual treatment.

## Capabilities

### New Capabilities

### Modified Capabilities

- `user-invites`: Invite e-mail HTML must use the landing-page LicitaDoc logo treatment and the app's light design-system palette while preserving existing invite delivery semantics and plaintext fallback.

## Impact

- Affected API code: `apps/api/src/shared/email/invite-email-template.ts`.
- Affected tests: `apps/api/src/shared/email/invite-email-template.test.ts`.
- Visual references: `apps/web/src/modules/public/pages/landing-page.tsx` for the scale-icon logo treatment and `apps/web/src/styles.css` for light design-system colors.
- No API contract, persistence, authentication, provider, or dependency changes are expected.

## Why

The invite e-mail currently renders the LicitaDoc brand mark with an inline `<svg>`, and e-mail compatibility checks flag SVG as unsupported by Gmail. Replacing SVG with a Gmail-safe image strategy keeps the updated branding while reducing broken or missing-logo rendering in major clients.

## What Changes

- Replace the invite e-mail's inline SVG logo with a Gmail-compatible raster image strategy, preferably PNG.
- Keep the logo inside the invite card, aligned with the current light-mode brand treatment and visible "LicitaDoc" text.
- Preserve graceful fallback branding when images are blocked, including accessible alt text and visible brand name.
- Add tests or checks that the rendered invite HTML contains no `<svg>` tags and still preserves invite semantics.
- Preserve current invite delivery behavior: recipient, subject intent, CTA target, role copy, temporary-password guidance, expiration context, plaintext fallback, Resend payload behavior, tags, and idempotency key.

## Capabilities

### New Capabilities

### Modified Capabilities

- `user-invites`: Invite e-mail HTML must avoid SVG assets and use Gmail-compatible brand rendering while preserving existing branded invite semantics.

## Impact

- Affected API code: `apps/api/src/shared/email/invite-email-template.ts`.
- Affected tests: `apps/api/src/shared/email/invite-email-template.test.ts`.
- Possible asset work: add or generate a small PNG logo asset or inline data URI suitable for e-mail clients.
- No API contract, persistence, authentication, provider, or database changes are expected.

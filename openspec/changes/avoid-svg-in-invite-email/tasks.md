## 1. Logo Asset Strategy

- [x] 1.1 Choose the stable public URL or static route that will serve the invite e-mail PNG logo.
- [x] 1.2 Add or generate the e-mail logo PNG asset from the LicitaDoc scale brand mark.
- [x] 1.3 Document the image dimensions, alt text, and fallback behavior in the template or nearby constants.

## 2. Template Update

- [x] 2.1 Replace the inline SVG brand icon in `apps/api/src/shared/email/invite-email-template.ts` with a PNG/JPG-compatible image element.
- [x] 2.2 Keep the logo inside the invite card with the current light palette, rounded mark treatment, and visible "LicitaDoc" text.
- [x] 2.3 Preserve owner invite and provisioned member invite copy, CTA targets, role labels, expiration context, plaintext fallback, Resend tags, and idempotency key.

## 3. Validation

- [x] 3.1 Update invite e-mail tests to assert rendered HTML contains no `<svg>`, `image/svg+xml`, or `.svg` references.
- [x] 3.2 Update tests to assert the replacement logo uses PNG/JPG-compatible markup or the documented non-SVG fallback.
- [x] 3.3 Run the focused API invite e-mail tests and any available e-mail compatibility check.

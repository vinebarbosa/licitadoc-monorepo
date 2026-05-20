## Context

Invite e-mails are rendered in `apps/api/src/shared/email/invite-email-template.ts` with React Email and static inline styles. The current template uses an `LD` text mark and hard-coded colors that do not match the public landing page logo treatment, where LicitaDoc is represented by the `Scale` icon inside a rounded `bg-primary/10` mark with the brand name beside it.

The landing page and app shell obtain colors from `apps/web/src/styles.css`, including the light-mode background, foreground, card, border, muted, primary, and primary-foreground tokens. E-mail clients cannot reliably consume Tailwind classes, CSS variables, or OKLCH values, so the invite template needs e-mail-safe static equivalents while keeping the visual intent of those tokens.

## Goals / Non-Goals

**Goals:**

- Render the invite e-mail in a light visual mode that matches the system palette.
- Replace the `LD` mark with a scale-icon brand mark equivalent to the landing page logo.
- Preserve visible textual branding with "LicitaDoc" and accessible logo labeling.
- Keep all invite delivery semantics and plaintext output stable.
- Cover the branding and palette change with focused unit tests.

**Non-Goals:**

- Redesign the public landing page or change the shared web design tokens.
- Change invite creation, acceptance, role assignment, URLs, expiration behavior, or provider delivery semantics.
- Add a new transactional e-mail design system beyond this template.
- Add a runtime dependency just to render the scale icon inside API e-mail HTML.

## Decisions

1. Keep the change inside the existing invite template boundary.

   The template already owns HTML, text fallback, CTA labels, role copy, and styles. Updating `invite-email-template.ts` keeps the mailer focused on delivery and avoids spreading e-mail presentation rules into invite services or web modules.

2. Represent the landing logo as e-mail-local static markup.

   The API package should not import the web landing component or add `lucide-react` only for this e-mail. Instead, the template can render a small e-mail-safe logo component that uses the same scale-icon shape and the same rounded mark treatment as the landing page. The visible brand name remains adjacent to the icon, and the logo keeps an accessible `Logo LicitaDoc` label. Tests should assert that the old `LD` mark is absent.

3. Use a dedicated light e-mail palette derived from web tokens.

   The template should define named constants for the light palette, mapping the web token intent to e-mail-safe hex colors: page background, card background, foreground, muted foreground, border, primary, primary foreground, and primary-tint surfaces. The template should not embed OKLCH or CSS variables in e-mail output because many clients will ignore or transform them inconsistently.

4. Declare and reinforce light color scheme in the rendered HTML.

   The React Email `Head` should include light color-scheme metadata where possible, and all body/card/CTA surfaces should use explicit light inline colors. This improves behavior in clients that otherwise try to invert dark-mode e-mails, while accepting that some clients may still apply user-controlled transformations.

5. Test semantic signals rather than full snapshots.

   Existing tests already verify invite content and Resend payload semantics. Extend them to verify the landing logo semantics, absence of the old `LD` mark, expected light palette color values, and preservation of owner/member invite behavior. Avoid full HTML snapshots so markup can evolve without obscuring regressions.

## Risks / Trade-offs

- Some e-mail clients may partially transform colors in dark-mode user settings -> Mitigate with explicit inline light colors and color-scheme metadata, while keeping contrast acceptable if a client still modifies the message.
- Inline SVG support varies across e-mail clients -> Mitigate by keeping visible "LicitaDoc" text and accessible logo labeling, and by testing the rendered HTML contract rather than assuming image loading.
- Duplicating palette values outside the web CSS can drift over time -> Mitigate by naming constants after the web tokens and documenting that they are e-mail-safe equivalents of the light design-system palette.
- Overfitting tests to markup details can make harmless template edits noisy -> Mitigate by asserting stable brand/palette semantics and delivery behavior, not complete HTML.

## Migration Plan

1. Update `invite-email-template.ts` with the e-mail-local scale logo and light palette constants.
2. Update invite e-mail tests to cover logo semantics, light-mode colors, and unchanged delivery behavior.
3. Run the API e-mail template tests and any relevant API test command for invite delivery.
4. Roll back by restoring the prior template constants and mark if the rendered e-mail regresses.

## Open Questions

- None. The requested direction is specific: use the landing-page logo treatment and the system light palette.

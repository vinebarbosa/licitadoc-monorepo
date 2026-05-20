## Context

The API currently sends invite e-mails through `ResendInviteMailer`, building the HTML body with handwritten string arrays in `apps/api/src/shared/email/invite-mailer.ts`. That works functionally, but the message is visually bare, hard to evolve, and easy to make inconsistent across the two invite paths: organization owner invites and provisioned member invites with temporary credentials.

Resend receives static `html` and `text` payloads, so any richer template approach must render to plain HTML before the provider call. The existing mailer contract, idempotency key, tags, recipient, and plaintext fallback are part of the delivery behavior and should remain stable.

## Goals / Non-Goals

**Goals:**

- Introduce a reusable branded invite e-mail template that can render static HTML for Resend.
- Use an e-mail-oriented component/rendering library such as React Email when it fits the API build and runtime constraints.
- Include LicitaDoc branding with a logo or brand mark strategy that is safe for e-mail clients.
- Preserve the existing invite semantics, including CTA target selection, temporary password handling, expiration context, text fallback, Resend tags, and idempotency.
- Add focused tests around rendered content and provider payload behavior.

**Non-Goals:**

- Redesign every transactional e-mail in the product.
- Change invite creation, acceptance, role assignment, or authentication behavior.
- Add a full e-mail design system beyond what the invite template needs.
- Require a new provider secret for basic invite e-mail delivery.

## Decisions

1. Render the invite e-mail through a dedicated template module instead of building HTML directly in the mailer. The mailer should orchestrate delivery, while the template owns layout, copy structure, CTA labels, and brand presentation.
2. Prefer React Email-style components and server-side rendering to HTML if the dependency set stays compatible with the current Node 24 API build. If the dependency introduces unacceptable build or runtime friction, fall back to a small local renderer that keeps the same template boundary.
3. Keep the plaintext fallback as a first-class output. It must continue to include the same target URL, role context, temporary password when applicable, first-access guidance, and expiration context.
4. Use an e-mail-safe brand strategy. Prefer a stable public logo URL when one exists; otherwise use a text/brand-mark fallback so the e-mail remains branded even when images are blocked.
5. Test meaningful content and provider semantics instead of snapshotting the full HTML. This keeps tests useful while allowing layout markup to evolve.

## Risks / Trade-offs

- React Email dependencies may increase install/build time or interact poorly with the current API bundle. The implementation should keep dependencies scoped to the API package and verify build output before committing.
- Remote logo images may be blocked by e-mail clients. The template needs alt text and visible textual branding so the message still reads as LicitaDoc.
- E-mail clients have uneven CSS support. The template should favor simple layout, inline-safe styling, and conservative markup.
- Temporary passwords are sensitive. The change should preserve current behavior but present the password clearly and avoid introducing extra logging or exposure.

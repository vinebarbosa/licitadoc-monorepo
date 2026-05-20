## Context

The invite e-mail brand refresh moved the LicitaDoc mark toward the public landing-page logo treatment, but the current implementation uses an inline `<svg>` for the scale icon. E-mail QA now flags this because Gmail does not reliably support SVG images in HTML e-mails.

The e-mail template is rendered by the API with React Email and delivered to Resend as static HTML plus plaintext. The template needs an e-mail-safe brand mark that keeps the same visual intent without relying on SVG, CSS variables, or browser-only behavior.

## Goals / Non-Goals

**Goals:**

- Remove all `<svg>` tags and SVG image references from rendered invite e-mail HTML.
- Keep the logo inside the invite card with the same light brand composition and visible "LicitaDoc" text.
- Use a Gmail-compatible raster logo strategy, preferably a small PNG served over HTTPS.
- Preserve accessible branding and useful fallback when images are blocked.
- Preserve invite delivery semantics and plaintext fallback.

**Non-Goals:**

- Redesign the landing-page logo or app design system.
- Change invite creation, acceptance, authentication, delivery provider, tags, or idempotency behavior.
- Add a generalized asset pipeline for every transactional e-mail.
- Depend on Gmail-specific markup at the expense of other mainstream e-mail clients.

## Decisions

1. Replace inline SVG with an `<img>` pointing to a PNG logo asset.

   Gmail and other e-mail clients are much more predictable with PNG/JPG images than inline SVG. The logo image should be small, versionable, and sized explicitly in the HTML. The surrounding rounded square can remain inline-styled HTML so the image stays visually aligned with the landing-page mark.

2. Prefer a public HTTPS PNG asset over a data URI.

   Data URI images are inconsistently handled by major e-mail clients, including Gmail. A stable public HTTPS asset is the safer default. If the product cannot expose a public asset immediately, the implementation should keep visible text branding and avoid SVG rather than replacing SVG with another poorly supported embedding mode.

3. Keep "LicitaDoc" as visible text next to the image.

   The visible brand name is important because e-mail clients and user settings may block remote images. The image should include meaningful `alt` text, but the template should not depend on the image alone to identify the sender.

4. Test the rendered HTML for absence of SVG.

   Existing tests should continue checking invite semantics, while new assertions verify there is no `<svg>`, no `image/svg+xml`, and no `.svg` asset reference in the rendered HTML. Tests should also assert the replacement brand path uses a PNG/JPG-compatible image or a documented non-image fallback.

## Risks / Trade-offs

- Public image URL may be misconfigured -> Mitigate by keeping visible "LicitaDoc" text and adding tests around the expected configured URL shape.
- Remote images may be blocked by the recipient's e-mail client -> Mitigate with `alt` text and visible adjacent brand name.
- PNG asset can drift from the landing icon -> Mitigate by deriving it from the same scale mark and keeping dimensions/color documented in the template or asset name.
- Adding a public asset route can increase implementation scope -> Mitigate by using the smallest existing static hosting path or configuration already available to the app.

## Migration Plan

1. Add or identify a stable PNG logo asset for e-mail use.
2. Update the invite e-mail template to render the brand image with explicit dimensions and no SVG markup.
3. Keep the light card layout and visible brand text unchanged.
4. Update tests to assert no SVG and preserved invite semantics.
5. Run the focused invite e-mail tests and any e-mail compatibility checks available.

## Open Questions

- Which public base URL should serve the PNG asset in production and preview environments?

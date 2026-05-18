## Context

The API already has an S3-compatible storage provider with object retrieval and upload helpers for expense-request PDFs and support-ticket images. Organization records currently store institutional data and an optional `logoUrl`, but they do not store a full-page print letterhead. The web document preview prints the existing rendered document through `window.print()` and print-specific CSS scoped by `data-document-preview-print-root`.

The provided file is `/Users/vine/Desktop/ARQUIVOS LICITADOC/IMAGENS PREF PUREZA/papel_timbrado.png`, a 1448x2048 PNG with RGBA data. Its aspect ratio matches an A4-like portrait page and should be treated as a full-page background for printed documents, not as document body content.

## Goals / Non-Goals

**Goals:**

- Store an organization's active letterhead image in the existing S3-compatible bucket.
- Persist only the active letterhead URL on the organization profile.
- Allow authorized organization managers to upload or replace the active print letterhead.
- Render the active letterhead behind printed A4 pages only.
- Keep the on-screen document preview untimbrado.
- Ensure generated Markdown/Tiptap content remains unchanged; letterhead is a rendering layer.
- Seed or upload the Pureza/RN `papel_timbrado.png` asset for the Pureza organization during implementation.

**Non-Goals:**

- Building a full brand design manager.
- Editing or generating letterhead images.
- Embedding the letterhead inside generated Markdown.
- Making the bucket publicly listable.
- Changing document-generation prompts or document content because of the letterhead.

## Decisions

### Decision 1: Store a single active letterhead per organization

Add a single nullable `letterheadUrl` field to the organization profile. The uploaded object uses a deterministic organization-scoped key, so the database does not need bucket, key, MIME, size, or dimension columns.

Alternative considered: create a full `organization_assets` table with metadata and version history. That may be useful later, but it is broader than needed for one active print timbre.

### Decision 2: Use an authenticated asset route instead of a public bucket URL

Serve the letterhead through an API route such as `GET /api/organizations/:organizationId/letterhead/image`, scoped by the same organization visibility rules. The route streams the stored object from the bucket and returns the original image content type.

Alternative considered: expose a public S3 URL. That would simplify CSS, but it weakens access control and creates environment-specific URL handling.

### Decision 3: Reuse multipart upload patterns

Add a multipart upload endpoint such as `POST /api/organizations/:organizationId/letterhead` that accepts one PNG, JPEG, or WebP image. Reuse the support-ticket image upload validation style and add a storage provider method such as `storeOrganizationLetterhead`.

Storage key prefix:

`organization-letterheads/<organizationId>/papel-timbrado`

When replacing a letterhead, upload the new object to the same deterministic key and keep the organization's `letterheadUrl` pointing at the authenticated image route.

### Decision 4: Apply the letterhead only in print rendering

Document detail or current-organization payloads should expose the active `letterheadUrl` derived from the authenticated asset route. The document preview page should keep the screen sheet white and include only a print-only image layer.

The printed page should render the image as a full-page positioned layer behind content. This avoids depending on browser background-print settings and keeps the timbre out of the visible preview.

The content layer must keep enough top/bottom margins so the header and footer of `papel_timbrado.png` are not covered by document text.

### Decision 5: Keep pagination compatible

Apply the letterhead to every printed A4 surface, including completed Tiptap previews using pagination surfaces and Markdown fallback sheets. If the preview uses automatic pagination, the screen frames remain untimbrados while the print layer repeats. If no letterhead is configured, existing white-page behavior remains unchanged.

## Risks / Trade-offs

- Browser print backgrounds can be disabled by user settings -> Mitigation: render the letterhead as a positioned image layer inside each printable page, not only as CSS `background`, if tests show browser background printing is unreliable.
- The full-page image can obscure text if content margins are too small -> Mitigation: define letterhead-aware print padding and test with multi-page DFD/ETP/TR/Minuta previews.
- Authenticated image routes may not load inside print if cookies are unavailable or blocked -> Mitigation: use same-origin URLs and existing authenticated session cookies; add tests for URL presence and render path.
- Replacing a letterhead overwrites the deterministic object -> Mitigation: validate the new image before upload and keep a single active URL per organization.
- Large images can slow printing -> Mitigation: enforce MIME/size limits.

## Migration Plan

1. Add database migration for organization `letterhead_url`.
2. Extend storage provider types and S3 implementation with `storeOrganizationLetterhead`.
3. Add upload and image streaming API routes with authorization and OpenAPI schemas.
4. Expose `letterheadUrl` in organization and document preview responses.
5. Update web preview/print UI to keep screen preview white and apply the letterhead image per printed page.
6. Add a seed/import path for the provided Pureza/RN file and use it to upload `papel_timbrado.png` to the configured bucket.
7. Regenerate OpenAPI/client artifacts after API schema changes.

Rollback: remove/ignore `letterheadUrl` in the web UI and clear organization `letterhead_url`. Stored bucket objects can remain harmless or be cleaned up by key prefix.

## Open Questions

- Should the upload UI live in organization settings only, or should document preview also expose a quick “usar timbre” action for organization owners?
- Should admins be able to set letterheads for any organization from an admin screen immediately, or only through API at first?
- Should the first implementation use an image layer instead of CSS background by default to avoid browser print-background settings?

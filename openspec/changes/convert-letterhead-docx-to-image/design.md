## Context

The app currently has two paper-letterhead concepts. The older `letterheadUrl` path stores an image and is already consumed by completed document previews/print rendering. The newer organization documents tab uploads a `letterhead-template` file and stores `letterheadTemplateUrl`, but that file is not consumed by document rendering. Owner onboarding also has a letterhead input, but it only accepts image files.

This change should collapse the user-facing "papel timbrado" flow onto the existing active image letterhead path: images are stored directly; DOCX files are converted into a JPEG image and then stored as the active organization letterhead image.

## Goals / Non-Goals

**Goals:**

- Allow owners to upload PNG, JPEG, WebP, or DOCX paper letterhead files from both onboarding and `/app/organizacao`.
- Convert DOCX uploads to a single-page JPEG suitable for use as a full-page A4 letterhead background.
- Reuse the existing organization `letterheadUrl` storage key and authenticated image route used by document previews.
- Keep image uploads on the fast path with no conversion.
- Align UI copy and tests so "Modelo de Papel Timbrado" no longer implies a stored-but-unused DOCX/PDF template.
- Preserve document textual generation; only the rendering layer changes.

**Non-Goals:**

- Building a general DOCX editor or template engine.
- Applying DOCX content as editable generated document body content.
- Supporting multi-page paper letterhead variants in this change.
- Reworking document pagination beyond consuming the active letterhead image already supported by previews.
- Requiring letterhead upload during onboarding.

## Decisions

### Use the existing active image letterhead as the canonical output

All accepted inputs should produce the same stored result: `organization.letterheadUrl` pointing to `/api/organizations/:organizationId/letterhead/image`. The organization documents tab should upload paper letterhead through the same active letterhead endpoint used by onboarding and document preview instead of continuing to store the inactive `letterheadTemplateUrl` asset.

Alternative considered: keep `letterheadTemplateUrl` as the canonical DOCX/PDF source and teach previews to use it. Rejected because the preview/print stack already expects an image background, while browser-side DOCX rendering would be brittle and visually inconsistent.

### Convert DOCX on the API before storage

The API should normalize uploaded paper letterhead sources into a `NormalizedLetterheadUpload`. For supported image MIME types, it should keep the existing validation and storage behavior. For DOCX, it should convert the first page to a JPEG buffer, validate the output dimensions/size, then call the existing `setOrganizationLetterhead` helper.

Recommended conversion pipeline:

```text
DOCX upload
    │
    ▼
temporary .docx
    │  headless LibreOffice / soffice
    ▼
temporary PDF
    │  pdfjs-dist + @napi-rs/canvas
    ▼
JPEG buffer
    │
    ▼
storeOrganizationLetterhead(...)
```

The project already depends on `pdfjs-dist` and `@napi-rs/canvas`, so the new runtime dependency is the DOCX-to-PDF step. If LibreOffice is unavailable, the API should fail with a clear validation/configuration error rather than silently storing the DOCX as an unused asset.

Alternative considered: add a Node-only DOCX renderer. Rejected because DOCX layout fidelity is the important part of this feature, and headless LibreOffice is the more predictable conversion engine for real-world municipal templates.

### Keep conversion scoped and deterministic

The converter should live behind a small service boundary, for example `convertLetterheadDocxToJpeg`, so tests can stub conversion without requiring LibreOffice. Temporary files should be written under the OS temp directory, cleaned up in `finally`, and never exposed in API responses. The stored output should keep the deterministic organization letterhead key, so replacing a DOCX or image upload overwrites the active letterhead just like the current image flow.

Alternative considered: store both the source DOCX and the rendered JPEG. Rejected for this change because the product need is preview/print use, not source version history. Source retention can be revisited if users later need to download or edit the original DOCX.

### Align onboarding and organization workspace on one input contract

Both owner onboarding and organization management should advertise the same accepted source types and use the same backend normalization. The web should validate obvious client-side file type/size issues, but the API remains the source of truth. After upload, the UI should display the active letterhead as an image asset rather than a generic document template.

Alternative considered: keep onboarding image-only and make DOCX available only in organization settings. Rejected because onboarding is where owners are most likely to provide institutional assets before generating their first document.

## Risks / Trade-offs

- [LibreOffice runtime dependency may be missing in local/dev/deploy environments] -> Add a converter health/config check, clear error messages, documentation, and tests that can stub the converter.
- [DOCX rendering can differ from the user's desktop Word rendering] -> Use LibreOffice as a consistent server renderer and document that the first rendered page becomes the active A4 letterhead image.
- [Large or malformed DOCX files can be slow or fail conversion] -> Enforce existing upload size limits, add conversion timeout, and return a friendly validation error.
- [Converted JPEG may not match A4 proportions] -> Validate/render at a fixed A4 portrait target and reuse/extend letterhead dimension checks.
- [Existing `letterheadTemplateUrl` data becomes legacy] -> Stop writing it from the organization screen for active letterhead; leave existing stored values harmless until a later cleanup/migration decision.

## Migration Plan

1. Add DOCX MIME support and conversion normalization to the organization letterhead service.
2. Route both onboarding and organization workspace paper-letterhead uploads through the active letterhead upload endpoint.
3. Keep the existing `letterheadTemplateUrl` column/endpoint as legacy-compatible storage, but stop using it for the active user-facing paper letterhead flow.
4. Regenerate OpenAPI and `@licitadoc/api-client`.
5. Update web copy, accepted file types, previews, and tests.
6. Validate image upload, DOCX conversion upload, onboarding upload, and completed document preview consumption.

Rollback: disable DOCX acceptance and keep image-only `letterheadUrl` uploads. Converted JPEG objects remain valid active letterheads because they use the existing image flow.

## Open Questions

- Should `.doc` remain unsupported, or should it be accepted through the same LibreOffice path after DOCX is proven stable?
- Do we want to retain the original DOCX source for later download/editing, or is the rendered JPEG enough for this product moment?

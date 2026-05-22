## Why

The organization workspace and owner onboarding currently treat paper letterhead inconsistently: the generated document preview consumes an organization letterhead image, while the new organization documents tab stores a separate DOCX/PDF template asset that is not applied to documents. Owners should be able to upload either an already-rendered image or a DOCX paper letterhead and get the same usable print/preview result.

## What Changes

- Accept DOCX paper letterhead uploads in both owner onboarding and the organization documents tab.
- Convert uploaded DOCX paper letterhead files into a JPEG image suitable for use as the organization's active print letterhead.
- Skip conversion when the user uploads an already-supported image file, preserving the existing image letterhead flow.
- Store the resulting image through the existing organization `letterhead`/`letterheadUrl` path used by document previews, instead of leaving the DOCX as an unused institutional template.
- Align UI copy, accepted file types, validation, API schemas, generated client hooks, and tests around "paper letterhead image or DOCX source" behavior.
- Keep generated document textual content unchanged; the letterhead remains a rendering layer behind completed document previews/print output.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-management`: paper letterhead uploads, including owner onboarding uploads, must accept supported image files directly and DOCX files that are converted into the active organization letterhead image.
- `document-generation`: completed document preview/read behavior must continue using the active organization letterhead image produced by upload or conversion.

## Impact

- API organization upload/onboarding routes and schemas for paper letterhead uploads.
- Organization letterhead service, storage writes, validation, and tests.
- A backend DOCX-to-JPEG conversion dependency or local conversion utility.
- Generated OpenAPI and `@licitadoc/api-client` artifacts.
- Web owner onboarding and organization documents tab accepted file types, copy, upload hooks, and tests.
- Document preview smoke/regression tests that confirm converted/uploaded image letterheads are consumed by completed document previews.

## 1. Backend Letterhead Normalization

- [x] 1.1 Extend organization letterhead upload MIME handling to accept DOCX alongside existing PNG, JPEG, and WebP image inputs.
- [x] 1.2 Add a small DOCX-to-JPEG converter service boundary that writes temporary files, invokes the DOCX-to-PDF renderer, renders the first PDF page to JPEG, and cleans up temporary files.
- [x] 1.3 Reuse existing image validation/storage for image uploads so supported image files bypass conversion.
- [x] 1.4 Route converted DOCX output through `setOrganizationLetterhead` so the active `letterheadUrl` remains the canonical document-preview asset.
- [x] 1.5 Add clear API errors for unsupported MIME types, conversion failures, missing converter runtime, empty files, and files over size limits.

## 2. API Contracts and Onboarding

- [x] 2.1 Update organization letterhead upload schemas/OpenAPI metadata to describe image-or-DOCX paper letterhead sources.
- [x] 2.2 Update owner organization onboarding multipart handling so the optional `letterhead` file accepts supported images or DOCX and uses the same normalization path.
- [x] 2.3 Keep `letterheadTemplateUrl` routes/column legacy-compatible while ensuring the active paper letterhead flow writes `letterheadUrl`.
- [x] 2.4 Regenerate OpenAPI contracts and `@licitadoc/api-client`.

## 3. Web UI Alignment

- [x] 3.1 Update owner onboarding copy, accepted file types, local validation, and tests so the paper letterhead input accepts images or DOCX.
- [x] 3.2 Update `/app/organizacao` documents tab to manage the active paper letterhead image through the letterhead upload hook instead of the inactive template upload hook.
- [x] 3.3 Replace "Modelo de Papel Timbrado" copy with active paper-letterhead copy that explains images are used directly and DOCX is converted.
- [x] 3.4 Display the current active paper letterhead from `organization.letterhead.url` and keep download/replace controls consistent with other institutional assets.

## 4. Tests and Verification

- [x] 4.1 Add API unit tests for direct image letterhead upload, DOCX conversion upload, unsupported source rejection, and conversion failure behavior.
- [x] 4.2 Add onboarding API/web tests for optional DOCX paper letterhead submission and image submission.
- [x] 4.3 Add organization workspace web tests proving the documents tab uploads through the active letterhead flow and shows "Papel timbrado cadastrado" from `letterhead.url`.
- [x] 4.4 Add or update document preview tests proving completed documents consume active letterhead images created from either direct image upload or DOCX conversion.
- [x] 4.5 Run focused API/web typecheck, tests, OpenSpec validation, and API client generation checks.

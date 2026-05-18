## 1. Data Model and Storage

- [x] 1.1 Add a single organization `letterhead_url` field for the active print letterhead.
- [x] 1.2 Create and verify the database migration for `letterhead_url`.
- [x] 1.3 Extend storage provider types with `storeOrganizationLetterhead`.
- [x] 1.4 Implement S3 storage for letterheads under a deterministic `organization-letterheads/<organizationId>/papel-timbrado` key.
- [x] 1.5 Add validation helpers for letterhead image MIME type, size, and empty file.

## 2. API Contract

- [x] 2.1 Extend organization serialization schemas to expose a nullable same-origin letterhead image URL.
- [x] 2.2 Add protected multipart upload/replacement endpoint for organization letterheads.
- [x] 2.3 Add protected letterhead image streaming endpoint with organization visibility checks.
- [x] 2.4 Prevent generic organization update payloads from accepting raw `letterheadUrl`.
- [x] 2.5 Keep replacement simple by overwriting the deterministic bucket object.
- [x] 2.6 Update OpenAPI definitions and regenerate the API client.

## 3. Pureza/RN Asset Import

- [x] 3.1 Add a script or seed path to import `/Users/vine/Desktop/ARQUIVOS LICITADOC/IMAGENS PREF PUREZA/papel_timbrado.png`.
- [x] 3.2 Resolve the Pureza organization by CNPJ, slug, or explicit organization id before uploading.
- [x] 3.3 Upload the provided PNG to the configured bucket and persist it as the active Pureza letterhead.
- [x] 3.4 Fail safely without upload or URL changes when the target organization cannot be resolved.

## 4. Web Preview and Print Rendering

- [x] 4.1 Read letterhead URL from current organization or document detail data.
- [x] 4.2 Pass the letterhead URL to a print-only document layer.
- [x] 4.3 Keep completed document previews visually untimbrados without changing Markdown or Tiptap JSON content.
- [x] 4.4 Apply the letterhead to every printable A4 page, including paginated Tiptap previews and Markdown fallback previews.
- [x] 4.5 Preserve readable content margins so text does not overlap the header, footer, or watermark in the provided timbre.
- [x] 4.6 Keep existing white-page behavior unchanged when no letterhead is configured.

## 5. Tests

- [x] 5.1 Add API tests for successful upload, invalid upload rejection, authorization, URL persistence, and deterministic replacement.
- [x] 5.2 Add API tests for authorized/unauthorized letterhead image retrieval.
- [x] 5.3 Add organization serialization tests for null and populated letterhead URL.
- [x] 5.4 Add web tests proving completed previews carry a print-only letterhead layer when configured.
- [x] 5.5 Add web print CSS tests proving printing uses the letterhead and no-letterhead output remains unchanged.
- [x] 5.6 Add a seed/import test or dry-run coverage for Pureza letterhead resolution failure and success.

## 6. Validation

- [x] 6.1 Run focused API organization/storage tests.
- [x] 6.2 Run focused web document-preview tests.
- [x] 6.3 Run API and web typechecks affected by the new contract.
- [x] 6.4 Run OpenAPI generation/client generation if API schemas changed.
- [x] 6.5 Run OpenSpec validation for `add-organization-letterhead-printing`.

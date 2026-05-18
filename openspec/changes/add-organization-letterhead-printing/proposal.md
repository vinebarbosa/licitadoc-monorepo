## Why

Documents printed from LicitaDoc currently use the generic preview sheet instead of the municipality's official letterhead. The user provided Pureza/RN's `papel_timbrado.png` and wants it stored in the object bucket so printed documents render on that paper automatically.

## What Changes

- Add organization-level letterhead asset support, backed by the existing S3-compatible storage bucket.
- Add a protected API path to upload/replace an organization's print letterhead image and persist only the active letterhead URL.
- Serve the stored letterhead image through an authenticated asset endpoint that the print renderer can load.
- Apply the active organization letterhead as an A4 page background only when printing completed documents.
- Keep document text and on-screen preview unchanged; the letterhead is a print layer, not generated Markdown content.
- Seed or migrate Pureza/RN's provided `papel_timbrado.png` into the bucket for its organization when configured during implementation.

## Capabilities

### New Capabilities

- `organization-letterhead-printing`: Organization letterhead image storage, retrieval, and print rendering for generated documents.

### Modified Capabilities

- `organization-management`: Organization records expose and manage the active print letterhead URL.

## Impact

- Affected API: organization schemas/routes, storage provider, OpenAPI spec, generated API client.
- Affected database: organization table stores the active `letterhead_url`.
- Affected web UI: organization/admin settings for upload and document preview/print page styling.
- Affected storage: S3-compatible bucket receives letterhead images under an organization-scoped key prefix.
- Affected printing: document preview print CSS must render the letterhead behind every printed A4 page without covering document text.

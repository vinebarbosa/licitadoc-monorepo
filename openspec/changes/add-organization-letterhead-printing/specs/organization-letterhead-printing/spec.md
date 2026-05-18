## ADDED Requirements

### Requirement: Organization managers MUST upload an active letterhead image
The system MUST allow authorized organization managers to upload or replace the active print letterhead image for an organization using the existing object storage bucket.

#### Scenario: Organization owner uploads letterhead
- **WHEN** an authenticated `organization_owner` uploads one valid PNG, JPEG, or WebP image for their own organization
- **THEN** the system stores the image in the bucket under an organization-scoped key and persists only the active letterhead URL for that organization

#### Scenario: Admin uploads letterhead for any organization
- **WHEN** an authenticated `admin` uploads one valid letterhead image for an organization
- **THEN** the system stores the image and updates that organization's active letterhead URL

#### Scenario: Actor outside organization attempts upload
- **WHEN** an authenticated organization-scoped actor uploads a letterhead for a different organization
- **THEN** the system rejects the request without storing a new object

#### Scenario: Invalid upload is rejected
- **WHEN** an upload contains no file, multiple files, an unsupported MIME type, an empty file, or a file larger than the configured limit
- **THEN** the system rejects the upload and does not change the organization's active letterhead URL

### Requirement: Letterhead replacement MUST preserve a single active asset
The system MUST keep one active letterhead per organization while allowing replacement with a new image.

#### Scenario: Replacing an existing letterhead
- **WHEN** an authorized actor uploads a new valid letterhead for an organization that already has one
- **THEN** the system overwrites the deterministic stored object and keeps the organization pointing at the same active letterhead URL

#### Scenario: Replacement upload fails
- **WHEN** a replacement upload fails validation or storage
- **THEN** the system keeps the previously active letterhead URL unchanged

### Requirement: Stored letterhead image MUST be retrievable through an authorized route
The system MUST serve the active organization letterhead image through an authenticated API route or equivalent same-origin URL that enforces organization visibility.

#### Scenario: Authorized actor reads letterhead image
- **WHEN** an authenticated actor with visibility over the organization requests the active letterhead image
- **THEN** the system streams the stored object with its image content type and cache headers suitable for print rendering

#### Scenario: Organization has no letterhead
- **WHEN** an authorized actor requests a letterhead image for an organization without an active letterhead
- **THEN** the system returns a not-found response

#### Scenario: Unauthorized actor reads letterhead image
- **WHEN** an actor without visibility over the organization requests its active letterhead image
- **THEN** the system rejects the request

### Requirement: Document print MUST apply the active organization letterhead
The web document preview MUST keep the on-screen sheet untimbrada and MUST render the active organization letterhead only for printed pages.

#### Scenario: Screen preview has organization letterhead configured
- **WHEN** a completed document is previewed for an organization with an active letterhead
- **THEN** the screen preview remains untimbrada and the persisted Markdown or Tiptap JSON remains unchanged

#### Scenario: User prints document with letterhead
- **WHEN** the user prints a completed document for an organization with an active letterhead
- **THEN** every printed A4 page includes the letterhead image behind the text and preserves readable content margins

#### Scenario: Multi-page document is printed
- **WHEN** a completed document spans multiple printable pages
- **THEN** each printed page receives the same active letterhead image

#### Scenario: No letterhead is configured
- **WHEN** a completed document is previewed or printed for an organization without an active letterhead
- **THEN** the existing white-page preview and print behavior remains unchanged

### Requirement: Pureza/RN letterhead asset MUST be importable
The system MUST provide an implementation path to upload the provided Pureza/RN `papel_timbrado.png` into the configured bucket and associate it with the Pureza organization.

#### Scenario: Pureza letterhead seed is run
- **WHEN** the implementation seed/import command is run with `/Users/vine/Desktop/ARQUIVOS LICITADOC/IMAGENS PREF PUREZA/papel_timbrado.png` and the target Pureza organization is resolved
- **THEN** the system stores that PNG in the bucket and marks it as the active letterhead for the Pureza organization

#### Scenario: Pureza organization cannot be resolved
- **WHEN** the seed/import command cannot identify the Pureza organization
- **THEN** the command fails without uploading or changing the active letterhead URL

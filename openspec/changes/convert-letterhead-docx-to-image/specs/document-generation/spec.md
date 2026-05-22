## ADDED Requirements

### Requirement: Completed document previews use the active organization letterhead image
The system MUST render completed generated document previews with the active organization letterhead image when one exists, regardless of whether that image was uploaded directly or produced from a DOCX conversion.

#### Scenario: Completed document uses letterhead uploaded as image
- **WHEN** an organization has an active paper letterhead uploaded as an image
- **AND** an authorized actor opens a completed generated document for that organization
- **THEN** the document preview uses the active letterhead image as the page letterhead rendering layer

#### Scenario: Completed document uses letterhead converted from DOCX
- **WHEN** an organization has an active paper letterhead produced from a DOCX upload
- **AND** an authorized actor opens a completed generated document for that organization
- **THEN** the document preview uses the converted JPEG as the page letterhead rendering layer

#### Scenario: Completed document has no organization letterhead
- **WHEN** an organization has no active paper letterhead
- **AND** an authorized actor opens a completed generated document for that organization
- **THEN** the document preview renders without a paper letterhead layer

### Requirement: Document detail reads expose the active organization letterhead image URL
The system MUST expose the active organization letterhead image URL in generated document detail responses when the document's organization has one configured.

#### Scenario: Document detail includes active letterhead URL
- **WHEN** an authorized actor reads a completed generated document whose organization has an active paper letterhead
- **THEN** the document detail response includes `letterhead.url` pointing to the authenticated organization letterhead image route

#### Scenario: Document detail excludes inactive template assets
- **WHEN** an authorized actor reads a generated document whose organization only has a legacy paper template asset but no active letterhead image
- **THEN** the document detail response does not expose that template asset as `letterhead.url`

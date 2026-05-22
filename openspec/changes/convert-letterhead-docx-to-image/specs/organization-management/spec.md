## ADDED Requirements

### Requirement: Organization paper letterhead uploads normalize accepted sources into an active image letterhead
The system MUST allow authorized organization managers to upload a paper letterhead source as either a supported image file or a DOCX file, and MUST persist the result as the organization's active image letterhead.

#### Scenario: Authorized manager uploads an image paper letterhead
- **WHEN** an authorized organization manager uploads a PNG, JPEG, or WebP paper letterhead image for their organization
- **THEN** the system stores the image as the active organization letterhead without DOCX conversion
- **AND** the organization response exposes the active `letterhead` URL used by document previews

#### Scenario: Authorized manager uploads a DOCX paper letterhead
- **WHEN** an authorized organization manager uploads a DOCX paper letterhead source for their organization
- **THEN** the system converts the DOCX into a JPEG image
- **AND** the system stores the converted JPEG as the active organization letterhead
- **AND** the organization response exposes the active `letterhead` URL used by document previews

#### Scenario: Manager uploads an unsupported paper letterhead source
- **WHEN** an authorized organization manager uploads a paper letterhead source with an unsupported MIME type
- **THEN** the system rejects the upload without replacing the current active organization letterhead

### Requirement: Owner onboarding accepts image or DOCX paper letterhead sources
The system MUST allow an owner completing organization onboarding to attach an optional paper letterhead source as either a supported image file or a DOCX file.

#### Scenario: Owner completes onboarding with image paper letterhead
- **WHEN** an authenticated `organization_owner` without an organization submits valid onboarding data with a supported image paper letterhead
- **THEN** the system creates the organization
- **AND** stores the uploaded image as the organization's active letterhead
- **AND** returns the created organization with active `letterhead` data

#### Scenario: Owner completes onboarding with DOCX paper letterhead
- **WHEN** an authenticated `organization_owner` without an organization submits valid onboarding data with a DOCX paper letterhead
- **THEN** the system creates the organization
- **AND** converts the DOCX into a JPEG image
- **AND** stores the converted JPEG as the organization's active letterhead
- **AND** returns the created organization with active `letterhead` data

#### Scenario: Owner skips paper letterhead during onboarding
- **WHEN** an authenticated `organization_owner` without an organization submits valid onboarding data without a paper letterhead source
- **THEN** the system creates the organization without an active letterhead

#### Scenario: Onboarding paper letterhead conversion fails
- **WHEN** an authenticated `organization_owner` submits onboarding data with a DOCX paper letterhead that cannot be converted
- **THEN** the system rejects the onboarding submission
- **AND** does not complete onboarding with a silently missing letterhead

### Requirement: Organization workspace manages the active paper letterhead used by documents
The organization workspace MUST present paper letterhead upload as management of the active document letterhead image, not as a separate unused document template asset.

#### Scenario: Workspace displays active paper letterhead
- **WHEN** an owner opens the organization documents tab for an organization with an active letterhead
- **THEN** the UI displays the active paper letterhead as the file used by generated document previews

#### Scenario: Workspace replaces active paper letterhead
- **WHEN** an owner uploads a supported image or DOCX paper letterhead from the organization documents tab
- **THEN** the UI sends the source through the active paper letterhead upload flow
- **AND** refreshes the organization data so subsequent document previews use the replacement letterhead

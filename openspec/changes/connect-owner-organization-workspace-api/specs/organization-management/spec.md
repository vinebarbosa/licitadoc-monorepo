## MODIFIED Requirements

### Requirement: Organization profiles represent a prefeitura with institutional data
The system MUST persist organization records as prefeitura profiles and MUST expose their institutional fields and uploaded institutional asset URLs through the organization management contract.

#### Scenario: Reading organization detail returns institutional profile
- **WHEN** an authorized actor requests an organization by id
- **THEN** the system returns the stored organization with `name`, `slug`, `officialName`, `cnpj`, `city`, `state`, `address`, `zipCode`, `phone`, `institutionalEmail`, `website`, `logoUrl`, `crestUrl`, `letterhead`, `letterheadTemplateUrl`, `authorityName`, `authorityRole`, `isActive`, `createdByUserId`, `createdAt` and `updatedAt`

## ADDED Requirements

### Requirement: Organization managers MUST upload visual identity assets
The system MUST allow authorized organization managers to upload or replace the active logo and crest files for an organization using object storage.

#### Scenario: Organization owner uploads logo
- **WHEN** an authenticated `organization_owner` uploads one valid PNG, JPEG, SVG, or WebP logo for their own organization
- **THEN** the system stores the file under an organization-scoped logo key and persists the active `logoUrl` for that organization

#### Scenario: Organization owner uploads crest
- **WHEN** an authenticated `organization_owner` uploads one valid PNG, JPEG, SVG, or WebP crest for their own organization
- **THEN** the system stores the file under an organization-scoped crest key and persists the active `crestUrl` for that organization

#### Scenario: Admin uploads visual asset
- **WHEN** an authenticated `admin` uploads a valid logo or crest for any organization
- **THEN** the system stores the file and updates the target organization's active asset URL

#### Scenario: Invalid visual asset upload is rejected
- **WHEN** an upload contains no file, multiple files, an unsupported MIME type, an empty file, or a file larger than the configured limit
- **THEN** the system rejects the upload and does not change the organization's active asset URL

### Requirement: Organization managers MUST upload paper letterhead templates
The system MUST allow authorized organization managers to upload or replace the active paper letterhead template file for an organization using object storage.

#### Scenario: Organization owner uploads paper letterhead template
- **WHEN** an authenticated `organization_owner` uploads one valid DOC, DOCX, or PDF paper letterhead template for their own organization
- **THEN** the system stores the file under an organization-scoped letterhead-template key and persists the active `letterheadTemplateUrl` for that organization

#### Scenario: Admin uploads paper letterhead template
- **WHEN** an authenticated `admin` uploads a valid paper letterhead template for any organization
- **THEN** the system stores the file and updates the target organization's active `letterheadTemplateUrl`

#### Scenario: Invalid paper letterhead template upload is rejected
- **WHEN** an upload contains no file, multiple files, an unsupported MIME type, an empty file, or a file larger than the configured limit
- **THEN** the system rejects the upload and does not change the organization's active `letterheadTemplateUrl`

### Requirement: Organization asset files MUST be retrievable through authorized routes
The system MUST serve uploaded organization logo, crest, and paper letterhead template files through authenticated routes that enforce organization visibility.

#### Scenario: Authorized actor reads organization asset
- **WHEN** an authenticated actor with visibility over the organization requests an uploaded organization asset file
- **THEN** the system streams the stored object with its content type and private cache headers

#### Scenario: Organization asset is missing
- **WHEN** an authorized actor requests an organization asset that has not been uploaded
- **THEN** the system returns a not-found response

#### Scenario: Unauthorized actor reads organization asset
- **WHEN** an actor without visibility over the organization requests an uploaded organization asset file
- **THEN** the system rejects the request

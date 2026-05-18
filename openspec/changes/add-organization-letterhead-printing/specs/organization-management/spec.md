## MODIFIED Requirements

### Requirement: Organization profiles represent a prefeitura with institutional data
The system MUST persist organization records as prefeitura profiles and MUST expose their institutional fields, including active print letterhead URL, through the organization management contract.

#### Scenario: Reading organization detail returns institutional profile
- **WHEN** an authorized actor requests an organization by id
- **THEN** the system returns the stored organization with `name`, `slug`, `officialName`, `cnpj`, `city`, `state`, `address`, `zipCode`, `phone`, `institutionalEmail`, `website`, `logoUrl`, `letterhead`, `authorityName`, `authorityRole`, `isActive`, `createdByUserId`, `createdAt` and `updatedAt`

## ADDED Requirements

### Requirement: Organization profiles MUST expose active letterhead URL
The system MUST expose the active print letterhead URL on organization profile responses without exposing raw private bucket credentials.

#### Scenario: Organization has active letterhead
- **WHEN** an authorized actor reads an organization with an active letterhead
- **THEN** the response includes a `letterhead` object with a same-origin image URL

#### Scenario: Organization has no active letterhead
- **WHEN** an authorized actor reads an organization without an active letterhead
- **THEN** the response includes a null letterhead value or equivalent explicit absence state

### Requirement: Organization update APIs MUST NOT accept arbitrary letterhead URL changes
The system MUST manage the active letterhead URL through the dedicated upload/replacement flow instead of trusting arbitrary user-submitted URL changes in generic organization update payloads.

#### Scenario: Generic organization update includes letterhead URL
- **WHEN** an actor submits a generic organization update containing `letterheadUrl`
- **THEN** the system rejects or ignores that field and keeps active letterhead URL controlled by the upload flow

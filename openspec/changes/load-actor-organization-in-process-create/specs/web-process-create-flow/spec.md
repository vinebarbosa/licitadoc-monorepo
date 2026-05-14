## ADDED Requirements

### Requirement: Authenticated process creation MUST load the actor organization profile from the API
The authenticated process creation page MUST load the current actor organization from the production API when the user is not `admin`. The page MUST use the returned organization profile for the organization field, for department filtering context, and for the review summary instead of fabricating a local placeholder organization.

#### Scenario: Organization-scoped actor opens the create page
- **WHEN** an authenticated `organization_owner` or `member` opens `/app/processo/novo`
- **THEN** the page requests the current actor organization from the API and renders that stored organization as the selected organization in the wizard

#### Scenario: Organization profile loads successfully for non-admin actor
- **WHEN** the current organization query succeeds for a non-admin actor
- **THEN** the page uses that returned organization id as the fixed organization scope for the process form and summary

#### Scenario: Admin actor opens the create page
- **WHEN** an authenticated `admin` opens `/app/processo/novo`
- **THEN** the page continues using the organizations listing API so the admin can choose any organization explicitly

#### Scenario: Current organization query fails
- **WHEN** the page cannot load the current actor organization for a non-admin actor
- **THEN** the create flow surfaces the reference-data failure instead of silently substituting a fabricated organization record

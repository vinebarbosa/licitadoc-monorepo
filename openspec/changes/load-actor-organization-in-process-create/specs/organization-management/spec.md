## ADDED Requirements

### Requirement: Authenticated actors MUST be able to read their current organization profile
The system MUST expose an authenticated organization-self route that returns the stored organization linked to the current actor. `organization_owner` and `member` actors with a non-null `organizationId` MUST receive the same institutional organization profile exposed by the organization management contract, without requiring an `organizationId` path parameter.

#### Scenario: Organization-scoped actor reads the current organization
- **WHEN** an authenticated `organization_owner` or `member` with `organizationId` set requests the current organization route
- **THEN** the system returns the stored organization whose `id` matches the actor's `organizationId`

#### Scenario: Actor without organization requests the current organization
- **WHEN** an authenticated actor without a linked `organizationId` requests the current organization route
- **THEN** the system rejects the request because there is no current organization to read

#### Scenario: Current organization route does not grant arbitrary cross-organization access
- **WHEN** an authenticated actor requests the current organization route
- **THEN** the system resolves the organization exclusively from the authenticated actor context instead of accepting an arbitrary organization id from the caller

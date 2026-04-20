## Context

The database already contains a `departments` table, but it only models `organizationId`, `name`, `slug`, `createdAt`, and `updatedAt`, and there is no finished HTTP module around it. The requested domain is a prefeitura department model with responsible authority data, scoped management by organization, and no management access for common users.

There is also an existing `process_departments` relation keyed by `departmentId`, so any schema evolution for departments must preserve department identities and avoid breaking downstream relations. This makes the change more than a simple CRUD addition: it includes a data model correction plus a new administrative module.

## Goals / Non-Goals

**Goals:**
- Align the `departments` persistence model with the requested fields: `id`, `name`, `slug`, `organizationId`, `responsibleName`, `responsibleRole`, `createdAt`, and `updatedAt`.
- Provide department management routes for create, list, detail, and update.
- Enforce that only `admin` and `organization_owner` manage departments.
- Scope `organization_owner` actions to the actor's own organization.
- Preserve `departmentId` stability so existing relations such as `process_departments` keep working.

**Non-Goals:**
- Department deletion.
- Changing how `processes` or `process_departments` behave beyond keeping compatibility with department ids.
- Introducing public/member-facing department management.

## Decisions

### Decision: Keep `slug` as part of the department contract
The current schema already includes `slug`, and the requested department contract now confirms that `slug` is a first-class field. The module will expose and persist `slug` together with the department profile so secretarias have a stable friendly identifier inside each organization.

Alternatives considered:
- Remove `slug` and rely only on `name`.
  Rejected because the requested model explicitly includes `slug` and the table already has an organization-scoped uniqueness strategy around it.

### Decision: Make `organizationId` fixed after creation
Departments belong to exactly one organization, so the update contract will allow editing department profile fields (`name`, `slug`, `responsibleName`, `responsibleRole`) but will not support moving a department to another organization after it is created. This keeps organization scoping straightforward and avoids accidental reassignment across prefeitura boundaries.

Alternatives considered:
- Let admins reassign `organizationId` on update.
  Rejected because it adds migration-like behavior to a normal update route and complicates permission and consistency rules.

### Decision: Admin chooses organization, organization owner is implicitly scoped
For creation, `admin` can create a department for any `organizationId`, while `organization_owner` can create only for the actor's own organization. The service should derive or validate organization scope from the authenticated actor rather than trusting arbitrary cross-organization input from owners.

Alternatives considered:
- Require all actors to send any `organizationId`.
  Rejected because it makes owner-scoped creation easier to misuse and duplicates information already present in the actor context.

### Decision: Use an admin-style listing contract with pagination
Department list responses should follow the same paginated shape already used by users, invites, and organizations: `items`, `page`, `pageSize`, `total`, and `totalPages`. This keeps the admin API consistent and makes the generated client predictable.

Alternatives considered:
- Return a plain array for departments only.
  Rejected because it would create a different management pattern for a similar module.

- ### Decision: Keep `slug` unique inside each organization
The existing unique index on `(organizationId, slug)` matches the intended department identity model and should remain in place. The module should treat slug conflicts as organization-scoped collisions, so two organizations may reuse the same slug while a single organization may not.

Alternatives considered:
- Make `slug` globally unique.
  Rejected because departments are organization-bound and the current schema already scopes uniqueness correctly.

## Risks / Trade-offs

- [Existing departments may already contain live rows with `slug`] -> Keep migration focused on preserving `slug`, `id`, and `organizationId` while adding the new required fields carefully.
- [Owner scope can be bypassed if `organizationId` input is trusted] -> Always derive or validate owner organization scope from the authenticated actor.
- [New non-null responsible fields may be hard to backfill if old data exists] -> Plan migration assuming either no meaningful rows yet or a controlled one-time backfill before enforcing not-null.
- [Slug collisions may surface once the module is exposed] -> Return explicit conflict errors for duplicate department slugs within the same organization.
- [Departments are referenced by `process_departments`] -> Preserve department ids and avoid destructive table recreation when possible.

## Migration Plan

Update the `departments` table in place: keep `slug`, add `responsibleName` and `responsibleRole`, and preserve `id` so references from `process_departments` remain valid. If existing rows are present, backfill the new required columns before the final not-null enforcement. Then implement the new module, regenerate OpenAPI and the API client, and validate the affected packages.

## Open Questions

No open questions at this time. The proposal assumes department reads and writes belong to the administrative module, so `member` users do not get department management access.

## Context

`apps/api` already has a reusable API E2E harness for authentication, invites, and user management: it boots the real Fastify app, issues HTTP requests with `fetch`, persists session cookies, and prepares deterministic fixtures inside an isolated database. The `organizations` module, however, is still validated only at the service-test layer even though its most important behavior depends on real session auth, role-based access, route validation, and stored organization state all working together.

The organization-management surface exposed by the API is:

- `POST /api/organizations/` for organization onboarding creation
- `GET /api/organizations/` for paginated organization listing
- `GET /api/organizations/:organizationId` for organization detail reads
- `PATCH /api/organizations/:organizationId` for organization updates

These flows depend on actor role and organization linkage:

- An `organization_owner` without an organization can create one through onboarding.
- An `organization_owner` who already belongs to an organization cannot create another one.
- An `admin` can list, read, and update any organization.
- An `organization_owner` can list, read, and update only the owned organization, with admin-only field restrictions such as `isActive`.

Because the highest-value risks live at the integration boundary between auth, routing, policies, and persistence, this change benefits from an explicit design before implementation.

## Goals / Non-Goals

**Goals:**
- Add repeatable API E2E tests for organization onboarding creation, listing, detail reads, and updates.
- Exercise `/api/organizations/*` routes over real HTTP with authenticated sessions instead of direct service calls.
- Verify that `admin` and `organization_owner` actors see only the organizations they are allowed to manage.
- Verify that successful organization creation and updates are persisted in the database.
- Keep the suite runnable under the existing `pnpm test:e2e` workflow and isolated database strategy.

**Non-Goals:**
- Browser or frontend automation.
- Exhaustive E2E duplication of every validation branch already covered by module tests.
- Changing the organization-management API contract or authorization rules.
- Adding test-only bootstrap routes or a delete flow for organizations that the product does not expose.

## Decisions

### Decision: Build on the shared API E2E harness that already covers auth, invites, and users
The current API E2E helpers already solve server boot, cookie persistence, request helpers, and deterministic cleanup. Organization-management coverage should reuse that same harness so the repository keeps one execution model and one `test:e2e` entrypoint.

Alternatives considered:
- Create a separate organization-management test stack.
  Rejected because the Fastify + `fetch` harness already matches this backend-only need.
- Keep organization verification at the service-test layer only.
  Rejected because that misses real HTTP auth and route behavior.

### Decision: Create authenticated actors through the real auth flow, then scope them directly in the isolated test database
There is no public product route dedicated to promoting a user to `admin` or attaching an `organization_owner` to a specific organization only for tests. The cleanest approach is to authenticate actors through the real auth endpoints, then adjust role and `organizationId` in the E2E database before exercising the organization routes over HTTP.

Alternatives considered:
- Add temporary test-only bootstrap routes.
  Rejected because they would expand the application surface for test infrastructure only.
- Seed every actor with raw SQL only.
  Rejected because the E2E suite still needs real authenticated sessions.

### Decision: Use multiple actor sessions and explicit organization fixtures in the same suite
The organization routes change behavior depending on whether the caller is an `admin`, an `organization_owner` with an organization, or an `organization_owner` without one. The E2E suite should therefore manage multiple sessions and at least two stored organizations so it can prove visibility and write restrictions with representative data.

Alternatives considered:
- Use only one privileged actor and inspect database state.
  Rejected because that would not verify organization-owner restrictions and onboarding behavior.

### Decision: Verify successful onboarding and updates with follow-up database reads
Route responses show the immediate API result, but the biggest regression risk is that stored organization data no longer matches what the API returned. The E2E suite should therefore assert persisted writes with an explicit database read after successful `POST` and `PATCH` requests.

Alternatives considered:
- Assert only the HTTP response body.
  Rejected because it would miss persistence bugs behind response serialization.

### Decision: Focus E2E negatives on access control and onboarding restrictions, not every schema-validation branch
The module-level tests already cover several lower-level validation concerns. The E2E suite should prioritize failures that depend on real auth and policy scope, such as disallowed onboarding attempts, cross-organization reads, and `organization_owner` attempts to change admin-only fields.

Alternatives considered:
- Recreate every validation branch over HTTP.
  Rejected because it would slow the suite without increasing confidence proportionally.

## Risks / Trade-offs

- [Direct database promotion bypasses some product workflows] -> Limit direct writes to actor and organization bootstrap, and keep the organization-management behavior itself under real HTTP coverage.
- [Multi-actor fixtures can make the suite harder to follow] -> Use small, named helper flows for admin, owner-with-org, owner-without-org, and stored-organization setup.
- [Persisted organization state may leak between scenarios] -> Reuse deterministic cleanup keyed by fixture e-mails, organization names, and slugs before each scenario.
- [Coverage will not include every schema-validation branch] -> Keep unit tests as the exhaustive branch layer and use E2E for cross-layer confidence.

## Migration Plan

Add the organization-management helpers and test cases under the existing `apps/api` E2E tree, keep them behind `pnpm test:e2e`, and update the API E2E runbook only if the new suite adds fixture expectations worth documenting. No production rollout, rollback plan, or schema migration is required because this change adds automated verification only.

## Open Questions

No open questions at this time.

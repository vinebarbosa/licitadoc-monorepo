## Context

`apps/api` already has a reusable API E2E harness for authentication, invites, users, and organizations: it boots the real Fastify app, issues HTTP requests with `fetch`, persists session cookies, and prepares deterministic fixtures inside an isolated database. The `departments` module, however, is still validated only at the service-test layer even though its most important behavior depends on real session auth, organization scoping, route validation, unique-constraint translation, and stored department state all working together.

The department-management surface exposed by the API is:

- `POST /api/departments/` for department creation
- `GET /api/departments/` for paginated department listing
- `GET /api/departments/:departmentId` for department detail reads
- `PATCH /api/departments/:departmentId` for department updates

These flows depend on actor role and organization scope:

- An `admin` can create, list, read, and update departments across organizations.
- An `organization_owner` can create, list, read, and update departments only inside the owned organization.
- A `member` can list departments inside the member organization, but cannot create, read detail, or update departments.
- Non-admin actors without `organizationId` receive an empty paginated department list.

Because the highest-value risks live at the integration boundary between auth, routing, policies, DB conflicts, and persistence, this change benefits from an explicit design before implementation.

## Goals / Non-Goals

**Goals:**
- Add repeatable API E2E tests for department creation, listing, detail reads, and updates.
- Exercise `/api/departments/*` routes over real HTTP with authenticated sessions instead of direct service calls.
- Verify that `admin`, `organization_owner`, and `member` actors see only the department data they are allowed to access.
- Verify that successful department creation and updates are persisted in the database.
- Verify that same-organization slug conflicts and out-of-scope operations are translated into the expected API failures.
- Keep the suite runnable under the existing `pnpm test:e2e` workflow and isolated database strategy.

**Non-Goals:**
- Browser or frontend automation.
- Exhaustive E2E duplication of every schema-validation branch already covered by module tests.
- Changing the department-management API contract or authorization rules.
- Adding test-only bootstrap routes or a delete flow for departments that the product does not expose.

## Decisions

### Decision: Build on the shared API E2E harness that already covers auth, invites, users, and organizations
The current API E2E helpers already solve server boot, cookie persistence, request helpers, and deterministic cleanup. Department-management coverage should reuse that same harness so the repository keeps one execution model and one `test:e2e` entrypoint.

Alternatives considered:
- Create a separate department-management test stack.
  Rejected because the Fastify + `fetch` harness already matches this backend-only need.
- Keep department verification at the service-test layer only.
  Rejected because that misses real HTTP auth and route behavior.

### Decision: Create authenticated actors through the real auth flow, then scope them directly in the isolated test database
There is no public product route dedicated to promoting a user to `admin`, attaching an `organization_owner` to a specific organization, or creating a scoped `member` actor only for tests. The cleanest approach is to authenticate actors through the real auth endpoints, then adjust role and `organizationId` in the E2E database before exercising department routes over HTTP.

Alternatives considered:
- Add temporary test-only bootstrap routes.
  Rejected because they would expand the application surface for test infrastructure only.
- Seed every actor with raw SQL only.
  Rejected because the E2E suite still needs real authenticated sessions.

### Decision: Seed background department fixtures directly in the isolated database while keeping the route under test on real HTTP
Department list, read, update, and conflict scenarios need representative stored departments across at least two organizations before the HTTP request under test happens. The suite should create those prerequisite department rows with a small fixture helper, then exercise the route under test over HTTP so the assertions still cover auth, routing, policy, and serialization behavior.

Alternatives considered:
- Create every prerequisite department through the public API.
  Rejected because it would make the setup slower and harder to control for cross-organization conflict scenarios.

### Decision: Model three actor roles in the same suite because member behavior differs between listing and management actions
The highest-value department flows compare what an `admin`, an `organization_owner`, and a `member` can do against departments inside and outside the actor's organization. The suite should therefore manage multiple sessions and at least two organizations so it can prove that members can list in-scope departments while still being rejected for detail reads and writes.

Alternatives considered:
- Test only administrative actors.
  Rejected because it would miss the list-only behavior that is specific to `member`.

### Decision: Verify successful POST and PATCH operations with follow-up database reads
Route responses show the immediate API result, but the biggest regression risk is that stored department data no longer matches what the API returned. The E2E suite should therefore assert persisted writes with explicit database reads after successful creation and update requests.

Alternatives considered:
- Assert only the HTTP response body.
  Rejected because it would miss persistence bugs behind response serialization.

### Decision: Focus E2E negatives on auth, organization scope, and same-organization uniqueness
The module-level tests already cover several lower-level validation concerns such as schema normalization and rejected `organizationId` updates. The E2E suite should prioritize failures that depend on real auth and policy scope, such as member restrictions, owner cross-organization writes, empty non-admin listings without scope, and conflict translation for duplicate slugs in the same organization.

Alternatives considered:
- Recreate every schema-validation branch over HTTP.
  Rejected because it would slow the suite without increasing confidence proportionally.

## Risks / Trade-offs

- [Direct database promotion and fixture seeding bypass some product workflows] -> Limit direct writes to actor, organization, and background department bootstrap while keeping the department behavior itself under real HTTP coverage.
- [Multi-actor and multi-organization fixtures can make the suite harder to follow] -> Use small, named helper flows for admin, owner, member, organization, and department setup.
- [Persisted department state may leak between scenarios] -> Reuse deterministic cleanup keyed by fixture e-mails, organization slugs, and department slugs before each scenario.
- [Coverage will not include every schema-validation branch] -> Keep unit tests as the exhaustive branch layer and use E2E for cross-layer confidence.

## Migration Plan

Add the department-management helpers and test cases under the existing `apps/api` E2E tree, keep them behind `pnpm test:e2e`, and update the API E2E runbook only if the new suite adds fixture expectations worth documenting. No production rollout, rollback plan, or schema migration is required because this change adds automated verification only.

## Open Questions

No open questions at this time.

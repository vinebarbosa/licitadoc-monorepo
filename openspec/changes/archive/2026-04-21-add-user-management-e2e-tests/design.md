## Context

`apps/api` now has a reusable API E2E harness for authentication and invite flows: it boots the real Fastify app, makes HTTP requests over `fetch`, persists session cookies, and prepares deterministic test fixtures inside an isolated database. The `users` module, however, is still covered only through service-level tests even though its most important behavior depends on real session auth, role-based visibility, organization scoping, route validation, and persisted updates or deletions working together.

The user-management surface is fully authenticated and administrative:

- `GET /api/users/` for paginated user listing
- `GET /api/users/:userId` for scoped detail reads
- `PATCH /api/users/:userId` for administrative updates
- `DELETE /api/users/:userId` for administrative deletion

Because these flows rely on different actor roles (`admin`, `organization_owner`, and disallowed `member`) plus multiple organizations, the E2E suite needs richer fixture orchestration than the auth-only baseline.

## Goals / Non-Goals

**Goals:**
- Add repeatable API E2E tests for user listing, detail reads, updates, and deletion.
- Exercise `/api/users/*` routes over real HTTP with authenticated sessions rather than direct service calls.
- Verify that `admin` and `organization_owner` actors see only the users they are allowed to manage.
- Verify that successful updates and deletions are persisted in the database.
- Keep the suite runnable under the existing `pnpm test:e2e` workflow and isolated database strategy.

**Non-Goals:**
- Browser or frontend automation.
- Exhaustive E2E duplication of every validation edge case already covered by module tests.
- Changing the user-management API contract or authorization rules.
- Adding test-only product routes for actor bootstrap.

## Decisions

### Decision: Build on the shared API E2E harness that already covers auth and invites
The existing API E2E helpers already solve the hard parts of server boot, cookie persistence, and isolated cleanup. User-management coverage should reuse that same harness so the repo keeps one E2E execution model and one `test:e2e` entrypoint.

Alternatives considered:
- Create a separate user-management test stack.
  Rejected because the current Fastify + fetch harness already matches this backend-only need.
- Keep user-management verification at the service-test layer only.
  Rejected because that misses real HTTP auth and route behavior.

### Decision: Create authenticated actors through auth endpoints, then promote or scope them directly in the test database
There is no public product route dedicated to creating an `admin` or scoping an `organization_owner` solely for tests. The cleanest approach is to create signed-in users through the real auth flow, then adjust their role and `organizationId` in the isolated E2E database before exercising the user-management routes over HTTP.

Alternatives considered:
- Add temporary test-only bootstrap routes.
  Rejected because they would expand the application surface for test infrastructure only.
- Seed every actor with raw SQL only.
  Rejected because E2E actor sessions still need the real auth pipeline.

### Decision: Use multiple actor sessions and explicit organization fixtures in the same suite
The highest-value `users` flows compare what an `admin`, an `organization_owner`, and a `member` can do against users inside and outside the actor's organization. The suite should therefore model multiple sessions and at least two organizations so it can prove scope enforcement with representative data.

Alternatives considered:
- Use only one privileged actor and inspect database state.
  Rejected because that would not verify the organization-owner restrictions that are central to this module.

### Decision: Verify successful PATCH and DELETE operations with follow-up reads from the database
The route responses show the immediate API result, but the biggest regression risk is that stored user role, `organizationId`, or existence no longer match what the API reported. The E2E suite should therefore assert successful writes through a deliberate database read after the HTTP request completes.

Alternatives considered:
- Assert only the HTTP response body.
  Rejected because it would miss persistence bugs behind the response serialization layer.

### Decision: Focus E2E negatives on access control and management scope, not every validation branch
The module-level tests already cover several validation details, such as inconsistent role and organization combinations. The E2E suite should prioritize the cross-layer failures that depend on real auth and actor scope, like non-admin access, cross-organization reads, and organization owners attempting to manage privileged users.

Alternatives considered:
- Recreate every unit-test validation branch over HTTP.
  Rejected because it would slow the suite without increasing confidence proportionally.

## Risks / Trade-offs

- [Direct database promotion bypasses some product workflows] -> Limit direct writes to actor and organization bootstrap, and keep the user-management behavior itself under real HTTP coverage.
- [Multi-actor fixtures can make the suite harder to follow] -> Use small, named helper flows for admin, owner, member, and managed-user setup.
- [Persisted writes may leave state behind between tests] -> Reuse deterministic cleanup keyed by fixture e-mails and organization slugs before each scenario.
- [Coverage may miss some lower-level validation branches] -> Keep unit tests as the source of exhaustive branch coverage and use E2E for cross-layer confidence.

## Migration Plan

Add the user-management E2E helpers and test cases under the existing `apps/api` E2E tree, keep them behind `pnpm test:e2e`, and update the runbook only where the new suite adds fixture expectations worth documenting. No production rollout or schema migration is required because this change adds automated verification only.

## Open Questions

No open questions at this time.

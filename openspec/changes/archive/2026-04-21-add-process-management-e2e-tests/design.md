## Context

`apps/api` already has a reusable API E2E harness for authentication, invites, users, organizations, and departments: it boots the real Fastify app, issues HTTP requests with `fetch`, persists session cookies, and prepares deterministic fixtures inside an isolated database. The `processes` module, however, is still validated only at the service-test layer even though its most important behavior depends on real session auth, organization scoping, department-link validation, unique-constraint translation, process-department synchronization, and stored process state all working together.

The process-management surface exposed by the API is:

- `POST /api/processes/` for process creation
- `GET /api/processes/` for paginated process listing
- `GET /api/processes/:processId` for process detail reads
- `PATCH /api/processes/:processId` for process updates

These flows depend on actor role and organization scope:

- An `admin` can create, list, read, and update processes across organizations.
- An `organization_owner` can create, list, read, and update processes only inside the owned organization.
- A `member` can create, list, read, and update processes only inside the member organization.
- Non-admin actors without `organizationId` receive an empty paginated process list.
- Every created or updated process must use `departmentIds` that belong to the same organization as the process.
- Updating a process must resynchronize `process_departments` without breaking existing `documents.processId` ownership.

Because the highest-value risks live at the integration boundary between auth, routing, policies, multi-table persistence, and conflict handling, this change benefits from an explicit design before implementation.

## Goals / Non-Goals

**Goals:**
- Add repeatable API E2E tests for process creation, listing, detail reads, and updates.
- Exercise `/api/processes/*` routes over real HTTP with authenticated sessions instead of direct service calls.
- Verify that `admin`, `organization_owner`, and `member` actors see and manage only the process data they are allowed to access.
- Verify that successful process creation and updates are persisted in the database, including `process_departments` synchronization.
- Verify that existing document ownership remains attached to the same `processId` after allowed process updates.
- Verify that foreign department ids, duplicate `processNumber` values in the same organization, and out-of-scope operations are translated into the expected API failures.
- Keep the suite runnable under the existing `pnpm test:e2e` workflow and isolated database strategy.

**Non-Goals:**
- Browser or frontend automation.
- Exhaustive E2E duplication of every schema-validation branch already covered by module tests.
- Changing the process-management API contract, authorization rules, or document ownership model.
- Adding test-only bootstrap routes or a delete flow for processes that the product does not expose.

## Decisions

### Decision: Build on the shared API E2E harness that already covers auth, invites, users, organizations, and departments
The current API E2E helpers already solve server boot, cookie persistence, request helpers, and deterministic cleanup. Process-management coverage should reuse that same harness so the repository keeps one execution model and one `test:e2e` entrypoint.

Alternatives considered:
- Create a separate process-management test stack.
  Rejected because the Fastify + `fetch` harness already matches this backend-only need.
- Keep process verification at the service-test layer only.
  Rejected because that misses real HTTP auth and route behavior.

### Decision: Create authenticated actors through the real auth flow, then scope them directly in the isolated test database
There is no public product route dedicated to promoting a user to `admin`, attaching an `organization_owner` to a specific organization, or creating a scoped `member` actor only for tests. The cleanest approach is to authenticate actors through the real auth endpoints, then adjust role and `organizationId` in the E2E database before exercising process routes over HTTP.

Alternatives considered:
- Add temporary test-only bootstrap routes.
  Rejected because they would expand the application surface for test infrastructure only.
- Seed every actor with raw SQL only.
  Rejected because the E2E suite still needs real authenticated sessions.

### Decision: Seed background organization, department, process, process-department, and document fixtures directly in the isolated database while keeping the route under test on real HTTP
Process scenarios need representative stored departments across at least two organizations, existing processes for conflict checks, join-table links for list and read assertions, and background documents to prove update preservation. The suite should create those prerequisites with small fixture helpers, then exercise the process routes over HTTP so the assertions still cover auth, routing, policy, and serialization behavior.

Alternatives considered:
- Create every prerequisite process and department through the public API.
  Rejected because it would make the setup slower and harder to control for cross-organization and document-preservation scenarios.

### Decision: Model three actor roles in the same suite because `member` is management-capable in this module
The highest-value process flows compare what an `admin`, an `organization_owner`, and a `member` can do against processes inside and outside the actor's organization. The suite should therefore manage multiple sessions and at least two organizations so it can prove that members can create and update in-scope processes while still being rejected outside that scope.

Alternatives considered:
- Test only administrative actors.
  Rejected because it would miss a key rule of this module: `member` is authorized within the member organization.

### Decision: Verify successful POST and PATCH operations with follow-up database reads across both the process row and its join-table links
Route responses show the immediate API result, but the biggest regression risk is that stored process fields or `process_departments` links no longer match what the API reported. The E2E suite should therefore assert persisted writes with explicit database reads after successful creation and update requests.

Alternatives considered:
- Assert only the HTTP response body.
  Rejected because it would miss persistence bugs behind response serialization.

### Decision: Verify that process updates do not break existing `documents.processId` ownership by seeding a linked document directly in the database
The process-management spec requires updates to preserve the ownership model where one process can have many documents and each document belongs to exactly one process. The E2E suite should seed a stored document linked to the target process, perform an allowed update through HTTP, and confirm the document remains attached to the same `processId`.

Alternatives considered:
- Omit document ownership checks from the process suite.
  Rejected because that would leave one of the module's most important persistence guarantees uncovered at the API integration layer.

### Decision: Focus E2E negatives on auth, organization scope, foreign department ids, and same-organization uniqueness
The module-level tests already cover several lower-level validation concerns such as schema normalization. The E2E suite should prioritize failures that depend on real auth and policy scope, such as unauthenticated access, out-of-scope reads or updates, foreign department assignments, and duplicate `processNumber` values inside the same organization.

Alternatives considered:
- Recreate every schema-validation branch over HTTP.
  Rejected because it would slow the suite without increasing confidence proportionally.

## Risks / Trade-offs

- [Direct database promotion and fixture seeding bypass some product workflows] -> Limit direct writes to actor, organization, department, process, join-table, and document bootstrap while keeping the process behavior itself under real HTTP coverage.
- [Multi-table fixtures can make the suite harder to follow] -> Use small, named helper flows for admin, owner, member, organization, department, process, and document setup.
- [Persisted process or join-table state may leak between scenarios] -> Reuse deterministic cleanup keyed by fixture e-mails, organization slugs, department slugs, process numbers, and linked document records before each scenario.
- [Coverage will not include every schema-validation branch] -> Keep unit tests as the exhaustive branch layer and use E2E for cross-layer confidence.

## Migration Plan

Add the process-management helpers and test cases under the existing `apps/api` E2E tree, keep them behind `pnpm test:e2e`, and update the API E2E runbook only if the new suite adds fixture expectations worth documenting. No production rollout, rollback plan, or schema migration is required because this change adds automated verification only.

## Open Questions

No open questions at this time.

## Context

`apps/api` already has a working API E2E harness for the auth flow: it boots the real Fastify app, talks to HTTP endpoints through `fetch`, and reuses session cookies across requests. The invite module, however, is still validated only at the service level in `src/modules/invites/invites.test.ts`, even though its most important behavior depends on route wiring, session authentication, role-based authorization, organization scoping, and database persistence working together.

The invite surface spans both public and authenticated endpoints:

- `POST /api/invites/` for privileged invite creation
- `GET /api/invites/` for scoped invite listing
- `GET /api/invites/:inviteToken` for token preview
- `POST /api/invites/:inviteToken/accept` for authenticated redemption

Because invite creation requires `admin` or `organization_owner` actors, and invite acceptance mutates the invited user's account, the E2E suite needs richer fixture setup than the existing auth-only coverage.

## Goals / Non-Goals

**Goals:**
- Add repeatable API E2E tests for invite creation, listing, preview, and acceptance.
- Exercise invite routes over real HTTP with real auth sessions rather than direct service calls.
- Verify role-scoped behavior for both `admin` and `organization_owner` inviters.
- Verify that accepting an invite updates the invited user's stored role and `organizationId`.
- Keep the suite runnable under the existing `pnpm test:e2e` workflow and isolated database strategy.

**Non-Goals:**
- Browser or email-delivery automation.
- Exhaustive E2E coverage of every invite edge case already covered by module tests.
- Changing the invite API contract or authorization rules.
- Adding test-only product endpoints just to create privileged fixtures.

## Decisions

### Decision: Extend the existing API E2E harness instead of introducing a new test stack
The current auth E2E harness already proves that the app can be booted once per suite, spoken to over real HTTP, and exercised with a minimal cookie jar. Invite coverage should build on that same foundation so the API keeps one E2E execution model and one `test:e2e` entrypoint.

Alternatives considered:
- Introduce a separate invite-specific E2E framework.
  Rejected because the current Fastify + fetch harness already matches the backend-only testing need.
- Keep invite coverage at the service-test level only.
  Rejected because that misses real session auth, route schemas, and HTTP error behavior.

### Decision: Seed privileged users and organizations directly in the test database, but perform invite actions through HTTP
There is no public bootstrap route that can create an `admin`, assign an `organization_owner`, or create an organization fixture solely for tests. The cleanest path is to use the existing auth endpoints to create signed-in users, then adjust the necessary role and organization records directly in the isolated E2E database before exercising invite routes over HTTP.

Alternatives considered:
- Add temporary test-only setup routes.
  Rejected because they would expand the application surface for infrastructure needs only.
- Create all fixtures through raw SQL snapshots or preloaded dumps.
  Rejected because they are harder to reason about and less explicit than small helper functions.

### Decision: Model invite journeys with separate inviter and invitee sessions
The highest-value invite flows involve more than one actor: a privileged inviter creates the token, and a different authenticated user redeems it. The suite should therefore maintain separate cookie jars and helper flows for inviter and invitee sessions so it can verify cross-user behavior without blurring responsibilities.

Alternatives considered:
- Reuse a single session and inspect only database state.
  Rejected because that would skip the real authenticated acceptance flow for the invited user.

### Decision: Use the create-invite response token as the authoritative test input for preview and acceptance
The API already returns the raw invite token and invite URL from the create endpoint. The E2E suite should reuse that token for preview and acceptance rather than inventing a side-channel mail fixture. This keeps the tests aligned with the current backend contract while avoiding extra infrastructure.

Alternatives considered:
- Stub an email transport and parse invite links from outbound messages.
  Rejected because the backend does not currently deliver invites through that mechanism.

### Decision: Add deterministic cleanup for invite, organization, and auth records tied to fixture identities
Invite E2E scenarios create organizations, users, sessions, accounts, and invites that can interfere with later runs if left behind. The suite should centralize cleanup around a known set of fixture e-mails and organization slugs so each scenario starts from a clean state without truncating unrelated development data.

Alternatives considered:
- Reuse the default development database without targeted cleanup.
  Rejected because invites and auth state would become flaky across runs.
- Truncate every table before each test.
  Rejected because it is heavier, less explicit, and more likely to break as the schema grows.

## Risks / Trade-offs

- [Direct database seeding bypasses some public workflows] -> Limit seeding to setup concerns that the product API does not expose, and keep the invite behavior itself under real HTTP coverage.
- [More E2E fixtures can increase runtime and flakiness] -> Reuse the existing server lifecycle, keep scenarios focused, and clean only the fixture rows each test creates.
- [Invite acceptance may require a fresh read to observe updated user state] -> Assert the post-accept result through a deliberate follow-up read, such as a database query or a fresh authenticated session endpoint request, rather than assuming stale in-memory data updates itself.
- [Shared helpers can become auth-flow-specific over time] -> Move toward generic API E2E helpers where it reduces duplication and keep invite-specific setup in dedicated fixture utilities.

## Migration Plan

Add the invite E2E helpers and test cases under the existing `apps/api` E2E path, keep them behind `pnpm test:e2e`, and update the runbook only where invite coverage adds new environment or cleanup expectations. No production rollout or schema migration is required because this change adds automated verification only.

## Open Questions

No open questions at this time.

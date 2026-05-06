## Context

The backend already supports the core organization-owner access workflow: owners can create member invites, list invites in their own organization scope, list users in their scope, and update or delete same-organization members. The missing piece is an owner-facing web surface that exposes those capabilities without relying on admin routes or direct API knowledge.

The existing admin users page is the closest reference implementation. It already solves routing, search-param driven state, modal-based actions, and generated-client integration, but it is intentionally admin-specific because it includes cross-organization filters and organization-owner provisioning. The new owner workflow needs a similar interaction model with a narrower scope and a different navigation entrypoint.

## Goals / Non-Goals

**Goals:**
- Add a dedicated owner-only route in the authenticated app where organization owners manage member access.
- Expose the owner's active members and pending member invites in one workflow, using the backend's existing scope rules as the source of truth.
- Allow owners to create member invites and perform allowed member actions with success/error feedback and query invalidation.
- Add backend and frontend coverage that proves the route remains owner-scoped and that the page stays aligned with the current API contracts.

**Non-Goals:**
- Replacing the admin users page with a single generic screen for all roles.
- Adding bulk access operations, invite resend/revoke, or member role elevation beyond the current `member` scope.
- Introducing a new persistence model or changing the invite/user authorization model already enforced in `apps/api`.

## Decisions

### Add an owner-only route and sidebar entry under the authenticated app shell
The web app will add a new owner-facing page at `/app/membros` and show a sidebar item only when the authenticated role is `organization_owner`.

Rationale:
- Owners already live inside the `/app` shell, so the page should behave like other day-to-day workflows rather than like the admin area.
- A dedicated route removes the need to overload `/admin/usuarios` with role-conditional behavior.

Alternatives considered:
- Reusing `/admin/usuarios` with role-conditional rendering: rejected because it mixes admin and owner navigation, breadcrumbs, and page actions.
- Placing the page under `/admin`: rejected because owners are not admin actors.

### Keep the implementation in the existing users domain instead of creating a separate members module
The owner page will live in `apps/web/src/modules/users`, alongside the admin users page and the generated-client adapters for invites and stored users.

Rationale:
- The workflow still belongs to the users/invites domain and relies on the same backend contracts.
- Keeping the work in one module allows selective sharing of form normalization, list item mapping, and mutation invalidation without introducing another cross-module boundary.

Alternatives considered:
- Creating a new `members` module: rejected because it would duplicate user/invite contracts and split one business domain across multiple frontend modules.
- Extracting a fully generic user-management framework first: rejected because admin and owner screens differ enough in scope, filters, and actions that premature abstraction would slow delivery.

### Reuse existing owner-scoped user and invite endpoints instead of adding an aggregate backend endpoint
The page will compose the current endpoints for member visibility and access actions: `GET /api/users`, `PATCH /api/users/:userId`, `DELETE /api/users/:userId`, `GET /api/invites`, and `POST /api/invites`.

Rationale:
- The backend already centralizes scope enforcement in the users and invites modules.
- Two focused queries are simpler to evolve and keep the generated API client aligned with backend route schemas.

Alternatives considered:
- Adding a dedicated "owner member management" aggregate endpoint: rejected for now because it would duplicate existing business rules and create another contract to keep in sync.

### Treat backend work as contract hardening and regression coverage, not a new permission model
Backend changes will be limited to whatever is required to support the page safely: confirming schemas expose the fields the page needs, extending coverage where owner-facing behavior is currently only implicit, and regenerating the API client if route schemas change.

Rationale:
- The product gap is mostly in the frontend surface, but the change still needs backend proof that owner-scoped contracts remain stable.
- This keeps implementation focused on the root problem instead of reworking permissions that already exist.

Alternatives considered:
- Expanding backend behavior preemptively with new invite-management features: rejected because the requested workflow does not require them.

## Risks / Trade-offs

- [Duplicating too much of the admin page] → Prefer a separate owner page with small shared helpers only where both screens truly use the same behavior.
- [Owner page depends on multiple queries and can render partial states] → Use explicit loading, empty, and error states for members and invites so the page remains usable when one dataset fails.
- [Route drift between web and backend permissions] → Add route tests in `apps/web` and owner-scope API coverage in `apps/api` so unauthorized access and scope leaks fail fast.
- [Future requests for invite resend/revoke could stretch the page design] → Keep the first version centered on create, list, edit, and delete so later invite lifecycle actions can be added intentionally.

## Migration Plan

No data migration is required. The safest rollout is backend-first or same-release because the backend contracts already exist; the web change mainly exposes them through a new route and navigation entry.

Rollback is low risk: remove the owner route and sidebar entry in `apps/web`, and revert any contract or test adjustments made in `apps/api`. Existing admin and onboarding flows remain unchanged.

## Open Questions

- Should the first version show pending invites and active members in separate cards/tables, or should invites be presented as a secondary section below the members list?
- Do we want owner-facing search/filter controls only for active members in v1, or also for pending invites if the invite volume grows?
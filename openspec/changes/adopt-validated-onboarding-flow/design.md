## Context

The current onboarding implementation is split in three directions:

- `organization_owner` users complete onboarding through older module-owned pages under `apps/web/src/modules/onboarding/pages/`.
- `member` users with `pending_profile` are allowed into the app shell and are blocked by `MemberOnboardingModal`.
- The product's validated onboarding UI already exists as public demo pages under `apps/web/src/modules/public/pages/onboarding-demo/`.

This divergence creates product drift, duplicates maintenance, and keeps sign-in plus route-guard logic more complex than it needs to be. The backend already has the core state model needed for the desired flow: `pending_profile`, `pending_organization`, and `complete`, with profile onboarding handled by `POST /api/users/me/onboarding/profile` and organization setup handled by the onboarding organization creation path.

The main constraints are:

- Do not reinvent the validated UI; the real onboarding flow should adopt it.
- Preserve public demo onboarding routes for isolated visual validation.
- Keep API changes narrow unless the validated frontend reveals a real contract mismatch.
- Support both `organization_owner` and `member` users with one coherent first-login journey.

## Goals / Non-Goals

**Goals:**

- Adopt the validated `onboarding-demo` UI for the real onboarding flow.
- Give both `organization_owner` and `member` users a dedicated page-based onboarding journey.
- Align sign-in redirects and protected-route gating with onboarding state instead of relying on the in-app member modal.
- Preserve the existing backend onboarding state machine unless a concrete frontend mismatch requires an API adjustment.
- Keep onboarding demo pages available after the real flow adopts the same UI.

**Non-Goals:**

- Redesigning the validated onboarding UI.
- Changing invite provisioning or temporary credential issuance rules.
- Introducing new onboarding states beyond `pending_profile`, `pending_organization`, and `complete`.
- Reworking broader user or organization management outside the first-login onboarding journey.

## Decisions

### Decision: Treat `onboarding-demo` as the canonical UI source for real onboarding

The validated pages in `apps/web/src/modules/public/pages/onboarding-demo/` should become the visual source of truth for the production onboarding experience. Implementation should reuse their composition, copy, and interaction patterns rather than recreating similar screens in `modules/onboarding`.

This does not require keeping production logic inside the public module. A practical implementation can extract shared presentational building blocks into module-owned onboarding UI and leave the demo routes as thin wrappers around the same components.

Alternative considered: copy the validated markup into the onboarding module and keep the demo pages separate. That would be faster at first, but it recreates the same drift that caused the current split.

### Decision: Move both roles to a dedicated page flow and retire the member modal as the primary path

Both `organization_owner` and `member` users with incomplete onboarding should be sent to dedicated onboarding pages. The member modal should no longer be the main completion surface once the validated UI is adopted.

The canonical journey becomes:

- `pending_profile` -> `/onboarding/perfil`
- `pending_organization` -> `/onboarding/organizacao`
- successful completion -> `/onboarding/concluido`

If legacy compatibility is needed, `/onboarding/membro/perfil` can remain as a redirect to the canonical profile route during transition.

Alternative considered: keep the owner page flow and only restyle the member modal. That would preserve the current split and violate the goal of adopting the validated onboarding journey.

### Decision: Keep existing onboarding APIs unless the validated UI exposes a real contract gap

The existing backend contracts already express the desired state progression:

- `POST /api/users/me/onboarding/profile` updates `name`, replaces the temporary password, and returns `pending_organization` for owners or `complete` for members.
- onboarding organization creation already requires `pending_organization` and completes the actor after creating the organization.

Implementation should therefore prefer adapting frontend form submission to these contracts over introducing new endpoints. Any API changes should be limited to concrete mismatches such as field normalization, optionality alignment, or response/session handoff that the validated UI genuinely needs.

Alternative considered: create a separate onboarding-specific API surface. That would add migration cost and duplicate semantics the backend already has.

### Decision: Add a real completion route before app entry

The validated UI includes an explicit success handoff page, and the real onboarding flow should preserve that moment rather than redirecting directly into `/app`. This gives both roles a consistent finish, allows a role-aware summary, and keeps the production journey aligned with the validated demo.

Alternative considered: navigate directly to `/app` after the final form submit. That would shorten the path but would not faithfully adopt the validated UI.

### Decision: Centralize onboarding access control in auth redirect helpers and route guards

Authentication redirect helpers and protected-route guards should decide whether a user belongs in onboarding, not the app shell. The app shell should stop carrying onboarding enforcement for members once the page flow is live.

This keeps the logic single-sourced:

- sign-in sends incomplete users to the correct onboarding step
- protected routes redirect incomplete users before app content renders
- onboarding routes remain responsible for the appropriate step UI

Alternative considered: keep mixed enforcement between auth helpers, route guards, and a blocking modal. That would continue the current inconsistency and complicate tests.

## Risks / Trade-offs

- [Risk] Reusing demo UI too literally could couple public demo concerns to production logic. -> Mitigation: share presentational components while keeping production state, data submission, and routing inside the onboarding module.
- [Risk] Removing the member modal changes a flow that existing tests and route assumptions rely on. -> Mitigation: update auth redirect logic, route guards, and onboarding tests together; keep a compatibility redirect during rollout if needed.
- [Risk] Session cache may briefly expose stale onboarding state immediately after profile or organization submission. -> Mitigation: continue using targeted session query updates plus invalidation, and make the completion handoff robust to freshly completed users.
- [Risk] The validated organization form may expose subtle mismatches with current API constraints. -> Mitigation: audit field names, formatting, and optional fields during implementation and normalize in the frontend adapter before widening backend contracts.

## Migration Plan

1. Extract or share the validated onboarding UI so demo routes and real onboarding routes can use the same visual building blocks.
2. Replace the current owner onboarding pages with the validated profile and organization experiences.
3. Route `member` users with `pending_profile` to the validated onboarding pages and remove the blocking modal from the primary flow.
4. Add the real onboarding completion route and wire final CTA navigation into `/app`.
5. Keep public demo routes available for validation and fallback comparison during rollout.

Rollback can restore the previous router and modal wiring while keeping any harmless shared UI extraction. Because the existing backend onboarding contract is already close to the desired flow, rollback should mainly be a frontend routing and composition reversal.

## Open Questions

- Should `/onboarding/concluido` stay accessible to already complete users as a harmless success page, or only as a fresh post-onboarding handoff?
- Should `/onboarding/membro/perfil` remain as a long-term alias for compatibility, or only as a temporary redirect during migration?

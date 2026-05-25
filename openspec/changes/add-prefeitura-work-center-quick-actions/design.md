## Context

The Central de Trabalho is implemented in `AppHomePage` with static document quick actions and a process summary. The organization workspace already exposes owner-facing sections for prefeitura data, members/invites, departments, and institutional documents, but those sections live behind `/app/organizacao` and use local tab state.

The authenticated session exposes `role` and `organizationId` through `useAuthSession`. The router already protects `/app/organizacao` with `OwnerOnlyRoute`, so the central must only advertise owner-only organization management actions to `organization_owner` users. Admin users represent platform administration and should not receive prefeitura shortcuts in the work center.

## Goals / Non-Goals

**Goals:**

- Add a second quick action group on the Central de Trabalho for prefeitura organization work.
- Keep document generation quick actions visible and unchanged.
- Gate organization-management shortcuts by the same role model used by routing.
- Make organization workspace tabs addressable from Central de Trabalho quick actions.
- Cover role-specific rendering and tab navigation with focused frontend tests.

**Non-Goals:**

- Add new backend endpoints or organization data contracts.
- Change the authorization rules for `/app/organizacao`.
- Give member users access to owner-only organization management screens.
- Redesign the full Central de Trabalho or organization workspace.

## Decisions

1. Use `useAuthSession` in `AppHomePage` for role-aware rendering.
   - Rationale: the app-shell already normalizes `admin`, `organization_owner`, and `member` in the auth module, so the central can reuse the same source of truth as route guards and sidebar behavior.
   - Alternative considered: fetch organization profile data before rendering actions. That would add latency and error states for links that only need role and organization presence.

2. Add a distinct prefeitura quick action group rather than mixing organization links into document actions.
   - Rationale: document creation and organization administration are different jobs. A separate section keeps scanning predictable and avoids changing the existing document action grid semantics.
   - Alternative considered: append the new cards to the existing grid. That makes the grid uneven by role and blurs the meaning of "Ações Rápidas".

3. Gate owner-only actions to `organization_owner` with a non-null `organizationId`.
   - Rationale: `/app/organizacao` is owner-only today, and showing blocked links to members would create a broken-feeling workflow.
   - Alternative considered: show disabled actions to members. That adds explanation copy and friction without a current authorized destination.

4. Support tab deep links on `/app/organizacao` using a query parameter such as `?tab=membros`.
   - Rationale: quick actions should land directly on the requested management area, and URL state makes this behavior refresh-safe and testable.
   - Alternative considered: pass React Router location state. That would work for clicks but fail on reloads and direct links.

## Risks / Trade-offs

- Owner-only actions can drift from route authorization -> keep the role predicate aligned with `OwnerOnlyRoute` and cover admin/member/owner render cases in tests.
- Query-string tabs can receive invalid values -> normalize unknown `tab` values to the default `dados` tab.
- Adding another action group may make the home page feel busier -> keep the section compact, use the existing card pattern, and avoid additional explanatory panels.

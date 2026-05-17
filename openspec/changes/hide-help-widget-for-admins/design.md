## Context

`AppShellLayout` currently renders `ContextualHelpWidget` for every route inside the authenticated app shell. Admin users also have a dedicated support inbox at `/admin/chamados`, so the floating requester widget appears on top of the workspace where admins are supposed to answer tickets.

The authenticated session already exposes the normalized user role through `useAuthSession`, and route guards/sidebar code already depend on that role. This change can therefore stay entirely in the web shell rendering layer.

## Goals / Non-Goals

**Goals:**
- Hide the contextual help widget for authenticated `admin` users across app-shell routes.
- Keep the widget available for `member` and `organization_owner` users.
- Preserve the current support ticket APIs, realtime behavior, and admin inbox behavior.
- Cover the role split with focused web tests.

**Non-Goals:**
- Do not change support ticket permissions, realtime channel capabilities, or backend schemas.
- Do not remove the contextual help widget component or alter its requester UX for non-admin users.
- Do not change admin navigation to `/admin/chamados`.

## Decisions

- Gate widget rendering in `AppShellLayout` using `useAuthSession().role`.
  - Rationale: the app shell is the single place that adds the floating widget to authenticated routes, so the role rule stays centralized.
  - Alternative considered: add an internal early return to `ContextualHelpWidget`. That would hide the widget too, but it makes a requester component responsible for app-shell role policy and is easier to miss in layout tests.

- Treat only the exact `admin` role as hidden.
  - Rationale: organization owners and members are requester-side users and still need the help entry point.
  - Alternative considered: hide the widget on `/admin/*` routes only. That would still show the widget to admins on non-admin pages, which keeps the duplicate support entry point alive.

- Update app shell tests instead of relying only on widget tests.
  - Rationale: the behavior is about layout placement and authenticated role visibility, not the internal help widget workflow.
  - Alternative considered: test only the widget component. That would not prove the app shell stops mounting it for admins.

## Risks / Trade-offs

- Role loading state can briefly be `null` while session data resolves -> keep existing loading/auth guard behavior intact and only hide for `role === "admin"` so non-admin rendering is not accidentally suppressed.
- Existing tests may not mock `useAuthSession` in app shell layout tests -> update the test setup explicitly so admin and non-admin scenarios are deterministic.
- Admins lose the quick requester widget on all app-shell pages -> acceptable because the admin support inbox is the canonical support workspace for that role.

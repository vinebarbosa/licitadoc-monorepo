## Context

The internal app shell renders a user menu with a `Sair` item, but the current UI only links to `/entrar`. That navigation leaves the server-side session intact and can leave React Query session state cached, so the user may still be authenticated after attempting to log out. The generated API client already exposes a `useSignOut` mutation for `/api/auth/sign-out`; the missing piece is wiring it into the web auth module and app shell UI.

## Goals / Non-Goals

**Goals:**
- Call the existing sign-out endpoint when the app shell logout action is triggered.
- Ensure frontend session state is cleared or invalidated after sign-out.
- Navigate the user to `/entrar` after logout so they leave the protected shell.
- Keep protected route guards enforcing unauthenticated state after logout.
- Add focused tests around the sidebar logout behavior and session cache transition.

**Non-Goals:**
- Change backend auth/session APIs.
- Add a global account settings page or session management UI.
- Implement logout from every public auth page.
- Add role-specific logout destinations.

## Decisions

### Decision: Wrap generated `useSignOut` in the auth module
The web module should export a local `useSignOut` wrapper from `@/modules/auth`, mirroring `useSignIn` and `useAuthSession`. This keeps generated client details out of app shell components and gives one place to add cache invalidation behavior if needed.

Alternatives considered:
- Import the generated `useSignOut` directly in the sidebar.
  Rejected because existing auth integration already hides generated hooks behind the module boundary.
- Use a raw `fetch` call.
  Rejected because the generated API client already owns the auth contract and typing.

### Decision: Make logout a button action, not a navigation link
The `Sair` item should trigger a mutation and then navigate to `/entrar`. It should not be an inert `Link`, because navigation alone does not terminate the session.

Alternatives considered:
- Keep the `Link` and rely on protected routes to redirect later.
  Rejected because it does not call the sign-out endpoint or clear the session.

### Decision: Invalidate or clear session cache after sign-out
After a successful sign-out, frontend session query state should no longer represent an authenticated user. The implementation should invalidate or reset the generated session query cache before or alongside navigation, so route guards and shell state observe the logout promptly.

Alternatives considered:
- Rely only on navigation to `/entrar`.
  Rejected because stale session cache can still make the app believe the user is authenticated.

## Risks / Trade-offs

- [Risk] Sign-out request failure could leave the user on the app shell without feedback. -> Mitigation: keep the action disabled while pending and preserve the current session if the mutation fails; tests can focus on success behavior.
- [Risk] Query key mismatch could fail to clear session state. -> Mitigation: use generated query helpers or invalidate broad auth session query keys already used by `useAuthSession`.
- [Risk] Navigating before cache invalidation could briefly render stale shell content. -> Mitigation: clear or invalidate session state before navigating away from `/app`.

## Migration Plan

Wire the frontend logout action to the existing sign-out mutation, add tests, and validate with focused frontend checks. Rollback is limited to restoring the previous sidebar menu item and removing the wrapper/tests.

## Open Questions

None.

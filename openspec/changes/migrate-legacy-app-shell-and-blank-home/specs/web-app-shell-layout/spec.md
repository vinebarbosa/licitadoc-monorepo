## ADDED Requirements

### Requirement: Internal app shell MUST be available through a protected base route
The web app MUST expose an internal app shell at `/app` and MUST treat that route tree as authenticated application space.

#### Scenario: Signed-in user opens the app shell
- **WHEN** an authenticated user navigates to `/app`
- **THEN** the app renders the migrated shell layout with its internal navigation chrome and content outlet

#### Scenario: Visitor without a session opens the app shell
- **WHEN** a visitor without an active session navigates to `/app`
- **THEN** the router redirects the visitor according to the existing sign-in guard behavior for protected routes

### Requirement: App shell home MUST start as an intentionally blank page
The `/app` home route MUST render an intentionally blank initial page inside the shell rather than seeded dashboard widgets or legacy placeholder business content.

#### Scenario: Authenticated user lands on the app home route
- **WHEN** an authenticated user opens `/app`
- **THEN** the shell content area renders the blank home entrypoint
- **AND** the route does not introduce metrics cards, lists, or other product content by default

### Requirement: Migrated shell runtime code MUST live inside the current frontend boundaries
The migrated app shell MUST be implemented inside `apps/web` using the current app, module, and shared UI boundaries, and MUST not depend on runtime imports from `tmp`.

#### Scenario: Contributor inspects the migrated shell implementation
- **WHEN** a contributor traces the runtime files that compose the app shell
- **THEN** the shell layout, header, sidebar, and home entrypoint live under the supported frontend source tree
- **AND** runtime code does not import directly from `tmp` or legacy `@/components/ui` aliases
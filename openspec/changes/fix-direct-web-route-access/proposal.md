## Why

Direct access to deployed web routes such as `https://staging.licitadoc.com/entrar` currently returns Vercel `404: NOT_FOUND` before the React router can render the page. This blocks invite/sign-in links and refreshes on valid client routes, even though those routes exist inside the Vite app.

## What Changes

- Add a deployment-level SPA fallback for the web app so valid client-owned routes resolve to `index.html`.
- Keep static assets and backend/API traffic from being captured by the SPA fallback.
- Verify direct browser entry, reload, and internal navigation for public auth routes, protected app routes, and unknown client routes.
- Document the deployment routing expectation so future Vite/React Router changes preserve direct URL access.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `web-authentication-flow`: Public auth routes must be reachable through direct deployed URLs, not only in-app navigation.
- `web-frontend-architecture`: The Vite SPA deployment must preserve centralized React Router ownership for client routes through a host-level fallback.
- `web-route-fallback-pages`: Unknown client routes must reach the app router's not-found page after the host fallback.

## Impact

- Affected package: `apps/web`
- Likely touched areas: Vercel/static deployment configuration for the web app, frontend routing documentation, Playwright direct-route coverage
- No backend API contract changes expected

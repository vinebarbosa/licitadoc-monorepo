## Context

`apps/web` is a Vite React single-page app using `createBrowserRouter`. The app router already owns `/entrar`, `/cadastro`, `/recuperar-senha`, protected `/app` routes, admin routes, and the catch-all not-found page. The staging screenshot shows Vercel returning `404: NOT_FOUND` for `/entrar`, which means the request is failing at the host/static routing layer before `index.html` and the React router are loaded.

There is no `apps/web/vercel.json` or equivalent SPA fallback configuration in the web package. The API package has its own Vercel config, but this fix should be scoped to the web deployment.

## Goals / Non-Goals

**Goals:**
- Ensure direct browser requests and reloads for client-owned routes serve the web app shell.
- Preserve React Router as the source of truth for route matching, redirects, auth guards, and the not-found page.
- Avoid rewriting static assets or backend/API traffic into `index.html`.
- Add verification that catches regressions in deployed-style direct route access.

**Non-Goals:**
- Replace `createBrowserRouter` with hash routing.
- Change auth API contracts, session cookies, or backend route behavior.
- Add server-side rendering.
- Change the UI or route names for the public auth pages.

## Decisions

### Decision: Add a Vercel SPA fallback in the web package
The web deployment should include a host-level rewrite/fallback that serves `index.html` for client-owned routes such as `/entrar`, `/app/processos`, `/admin/usuarios`, and unknown route paths that should render the in-app not-found page. In this repo, the most direct place is an `apps/web/vercel.json` because the issue is deployment routing rather than React route composition.

Alternatives considered:
- Configure the app to use hash URLs.
  Rejected because it would change public URLs and degrade existing invite/sign-in links.
- Add duplicate static files for every route.
  Rejected because the app has dynamic routes and centralized client routing.
- Handle `/entrar` only.
  Rejected because refresh/direct access can fail on every client-owned route, not just sign-in.

### Decision: Exclude assets and API-like paths from the fallback
The fallback must not capture built assets under Vite's asset path or requests that belong to backend/API infrastructure. The implementation should use Vercel routing syntax that keeps files such as JavaScript, CSS, images, source maps, and any `/api/*` traffic out of the SPA rewrite.

Alternatives considered:
- Rewrite every path to `index.html`.
  Rejected because it can mask missing static assets or interfere with non-SPA routes depending on Vercel routing precedence.
- Add separate rewrites for every known app route.
  Rejected because it creates drift with `src/app/router.tsx`.

### Decision: Verify with built preview and Playwright direct navigation
Existing Playwright coverage already opens `/entrar`, `/cadastro`, `/recuperar-senha`, `/nao-autorizado`, and an unknown route. The change should ensure this coverage runs against a built app/preview-like server path where direct URL handling is exercised, and it should add or adjust tests if the current setup would not catch missing host fallback behavior.

Alternatives considered:
- Rely only on unit router tests.
  Rejected because the failure happens before the React router starts.

## Risks / Trade-offs

- [Risk] A catch-all rewrite could serve `index.html` for missing assets and hide deploy problems. -> Mitigation: exclude asset/file paths and verify static bundle loading in the browser.
- [Risk] Vercel project root may differ between environments. -> Mitigation: place the config in the web app root and confirm staging uses that project root, or mirror the same rewrite in the actual Vercel project settings if needed.
- [Risk] The fallback could interfere with a future same-origin API path. -> Mitigation: reserve `/api/*` and document that API traffic should remain outside the web SPA fallback.
- [Risk] Preview server tests may not exactly match Vercel. -> Mitigation: combine local built preview checks with a staging smoke check after deployment.

## Migration Plan

Add the web deployment fallback, run the web build and direct-route browser checks, then deploy to staging. Confirm `https://staging.licitadoc.com/entrar` renders the sign-in page on first load and after reload. Rollback is limited to removing or disabling the web rewrite configuration.

## Open Questions

- Confirm whether the Vercel project root for `staging.licitadoc.com` is `apps/web` or the repository root.

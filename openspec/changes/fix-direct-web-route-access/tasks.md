## 1. Configure Web Deployment Fallback

- [x] 1.1 Confirm the Vercel project root used by `staging.licitadoc.com` and whether `apps/web/vercel.json` is picked up by that deployment.
- [x] 1.2 Add web deployment routing so client-owned non-asset URLs serve the built SPA entrypoint.
- [x] 1.3 Ensure the fallback excludes built static assets, file paths, and `/api/*` traffic.

## 2. Document Route Ownership

- [x] 2.1 Update `apps/web/architecture.md` or `apps/web/agents.md` with the deployed SPA fallback expectation.
- [x] 2.2 Document that React Router remains responsible for known routes, auth guards, redirects, and the in-app not-found page after the host fallback.

## 3. Validate Direct Route Access

- [x] 3.1 Run `pnpm --filter @licitadoc/web build` and confirm the production build still emits the expected static assets.
- [x] 3.2 Run a built preview or equivalent deployed-style local check and verify direct loads for `/entrar`, `/cadastro`, `/recuperar-senha`, `/app/processos`, `/admin/usuarios`, and `/rota-inexistente`.
- [x] 3.3 Add or adjust Playwright coverage if current E2E setup would not fail when the host fallback is missing.
- [ ] 3.4 After staging deployment, verify `https://staging.licitadoc.com/entrar` renders the sign-in page on first load and reload instead of Vercel `404: NOT_FOUND`.

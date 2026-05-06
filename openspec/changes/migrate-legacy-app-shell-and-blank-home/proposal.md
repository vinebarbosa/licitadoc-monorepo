## Why

O frontend já tem uma landing page pública funcional, mas ainda não possui o app shell interno legado migrado de `tmp`, nem uma home inicial simples para servir como destino base desse fluxo. Ao mesmo tempo, o switch de tema exposto na landing deixou de ser desejado e hoje adiciona uma affordance de teste numa página pública que deveria permanecer mais enxuta.

## What Changes

- Migrate the legacy internal app shell layout from `tmp` into `apps/web`, including the sidebar/header composition and router integration under the current architecture boundaries.
- Add a blank home page as the initial content route rendered inside the migrated app shell.
- Wire the app router so the public landing page and the internal app shell can coexist with clear route ownership.
- Simplify the public landing page header by removing the theme switch while preserving its primary navigation and CTA links.
- Add focused frontend validation for the migrated shell route and the simplified landing page behavior.

## Capabilities

### New Capabilities
- `web-app-shell-layout`: Internal app shell routing, layout composition, and the blank initial home page rendered inside the migrated shell.

### Modified Capabilities
- `web-public-landing-page`: The public landing page header and visible controls change so the theme switch is removed from the landing experience.

## Impact

- Affected package: `apps/web`
- Likely touched areas: `src/app/router.tsx`, shared layouts or app-shell composition, a new module-owned home/app-shell route entrypoint, migrated layout code from `tmp`, public landing page UI, and frontend tests
- Likely source inputs: `tmp/app-layout.tsx`, `tmp/app-header.tsx`, and `tmp/app-sidebar.tsx`
- No backend API contract changes are expected
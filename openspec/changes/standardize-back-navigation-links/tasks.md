## 1. Shared Back Affordance

- [ ] 1.1 Add a shared page-level back control component or helper that renders the approved `ArrowLeft` + `Voltar` treatment for link destinations.
- [ ] 1.2 Support history/callback usage with button semantics while preserving the same visual treatment and accessible name.
- [ ] 1.3 Add focused tests or coverage through consuming page tests so the shared affordance is protected from visual/semantic drift.

## 2. Authenticated Page Updates

- [ ] 2.1 Replace the process detail page's local back markup with the shared standard affordance without changing its `/app/processos` destination.
- [ ] 2.2 Update document create page back navigation from icon-only to the shared `Voltar` link while preserving its `/app/documentos` destination.
- [ ] 2.3 Update document preview page's top-level history-aware `Voltar` control to use the shared affordance while preserving existing history behavior.
- [ ] 2.4 Inspect adjacent authenticated create/edit/detail pages for top-level page-exit controls and apply the shared affordance where the spec scope applies.
- [ ] 2.5 Leave wizard step buttons, cancel buttons, auth links, and failure-state recovery links unchanged unless they are also top-level page-exit controls.

## 3. Verification

- [ ] 3.1 Update process detail tests for the shared `Voltar` link and unchanged parent route.
- [ ] 3.2 Update document create and preview tests for the new visible `Voltar` presentation and preserved navigation behavior.
- [ ] 3.3 Run focused web tests for affected process/document pages.
- [ ] 3.4 Run frontend lint/format/type checks required for the touched files.

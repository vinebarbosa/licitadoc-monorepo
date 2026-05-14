## Why

Back navigation currently appears with several shapes across the web app: plain text links, icon-only links, history buttons, and page-specific "Voltar para..." labels. The process detail page now has a clearer approved pattern, and applying it consistently will make page exits feel predictable without changing route behavior.

## What Changes

- Standardize page-level back controls in authenticated app pages to the process detail pattern: a subtle inline arrow-left action labeled `Voltar` placed near the top of page content.
- Keep destination behavior page-aware: list/detail/create/edit pages continue returning to their current logical parent or history target.
- Preserve non-page navigation controls such as wizard step `Voltar`, modal/drawer controls, auth-page login links, and empty/error-state recovery links when they serve a different purpose.
- Add or update focused frontend tests for pages whose visible back control changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `web-frontend-architecture`: Add a cross-module page navigation requirement for consistent page-level back controls inside authenticated app workflows.

## Impact

- Affected code: authenticated page components and UI modules that render page-level back actions, likely including process detail/edit/create surfaces, document create/preview surfaces, and route fallback pages only where they represent app page exits.
- Tests: update affected page tests that assert current back labels, hrefs, or button semantics.
- APIs, database, generated clients, and dependencies are not affected.

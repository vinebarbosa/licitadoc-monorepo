## Context

`/app/documentos` already receives document type deep links from the app sidebar, using `tipo=dfd|etp|tr|minuta`. The page reads `tipo` only while initializing `typeFilter`, so later route changes update the browser URL and sidebar active state without updating the select or the filtered rows. The search and status controls are also local-only, so filters chosen on the page are not reflected in the URL and cannot be restored by reload, sharing, or browser history.

The processes listing already has the pattern this page needs: parse filters from `useSearchParams`, derive controlled UI state from that parsed model, and write relevant filter changes back with `setSearchParams`.

## Goals / Non-Goals

**Goals:**

- Make URL query params the shared source for document list filters.
- Keep compatibility with the existing sidebar `tipo` parameter.
- Synchronize page controls and filtered rows when the URL changes after initial render.
- Write page filter changes back to the URL with clean default omission.
- Keep filtering client-side against the existing documents list response.
- Add focused tests around parsing, serialization, UI controls, and sidebar/deep-link behavior.

**Non-Goals:**

- Moving document filtering to the API.
- Changing backend routes, OpenAPI schemas, or generated API client code.
- Redesigning the documents page or sidebar.
- Adding pagination or new document actions.

## Decisions

### Decision: Centralize document filter parsing and serialization in model helpers

Add document-list filter helpers near `filterDocuments` in `apps/web/src/modules/documents/model/documents.ts`. The helpers should parse `URLSearchParams` into a typed filter object and serialize that object back to a new `URLSearchParams`, mirroring the processes model pattern.

The filter object should cover:

- `search`: text search, default `""`
- `typeFilter`: `DocumentType | "todos"`, sourced from `tipo`
- `statusFilter`: visible status values supported by the page, default `"todos"`

Invalid `tipo` or `status` values should normalize to `"todos"`. Empty or whitespace-only search should normalize to `""`.

Alternatives considered:

- Keep parsing inline in the page: quicker, but repeats fragile string handling and makes unit coverage harder.
- Keep local React state plus syncing effects: workable, but easier to drift and more complex than deriving from `searchParams`.

### Decision: Treat the route as the source of truth for controlled filters

`DocumentsListingPage` should call `useSearchParams()` with both getter and setter, derive `filters` from the current `searchParams`, and bind the search input and selects directly to that derived object. Filter changes should call a small route-update helper that merges the new partial filter values with current filters and then calls `setSearchParams(getDocumentsFilterSearchParams(nextFilters), { replace: true })`.

Using `replace: true` avoids adding a history entry for every keystroke while still keeping reload and share behavior correct. Browser back/forward still works for meaningful route entries created by sidebar navigation and external deep links.

Alternatives considered:

- Push a history entry for each filter change: useful for audit-like navigation, but noisy for typing in search.
- Only sync `tipo`: fixes the screenshot mismatch but leaves status/search unable to survive reload or sharing.

### Decision: Preserve sidebar links and validate their interaction through the page

The existing sidebar links should remain `/app/documentos?tipo=<type>`. The page fix should make those links sufficient: clicking DFD, ETP, TR, or Minuta while already on `/app/documentos` must update the page select and filtered rows because the route changed, not because the sidebar owns filter state.

If the current sidebar active detection proves too loose during tests, it can be tightened with `URLSearchParams`, but that is secondary to the page filter source-of-truth fix.

Alternatives considered:

- Add sidebar click handlers that call document page state directly: couples app shell navigation to page internals and would not fix reload/deep-link cases.
- Replace query links with path segments: unnecessary route churn for an existing public in-app contract.

## Risks / Trade-offs

- [Risk] Typing search updates the URL frequently. -> Mitigation: use `replace: true`, trim serialization, and omit empty search.
- [Risk] Invalid query values could put Radix Select in an unsupported state. -> Mitigation: normalize all parsed values before binding controls.
- [Risk] Tests may need realistic document API fixtures. -> Mitigation: keep helper tests pure and add one component test with MSW data for the visible integration behavior.
- [Risk] Sidebar active-state matching may not cover reordered query strings. -> Mitigation: page behavior does not depend on sidebar active state; tighten active parsing only if coverage exposes a real mismatch.

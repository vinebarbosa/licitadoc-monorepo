## Context

`AppSidebar` owns the main app navigation and currently defines `mainNavItems` with a static `badge: "5"` for Processos. Process listing data already comes from `GET /api/processes` through the frontend process module, and that response includes the actor-scoped `total` used by the listing page.

The fix should keep data access behind the frontend module boundary, avoid a new backend contract, and prevent the sidebar from showing mock or guessed counts during loading and error states.

## Goals / Non-Goals

**Goals:**
- Show the Processos sidebar badge from the live `total` returned by the existing process listing API.
- Keep the count scoped to the current authenticated actor by reusing the existing process listing contract.
- Remove the hardcoded `5` from sidebar navigation configuration.
- Add focused tests around successful, zero, loading, and error count states.

**Non-Goals:**
- Changing backend process listing semantics, authorization, pagination, or schemas.
- Adding a separate process count endpoint.
- Redesigning the sidebar or changing unrelated navigation items.

## Decisions

- Reuse the process module API boundary for the counter. `AppSidebar` should consume an exported process module hook rather than handwritten fetch logic or direct generated-client calls inside the app-shell component. Alternative considered: call `useGetApiProcesses` directly from the sidebar; that would leak generated endpoint details outside the process module.
- Request the smallest practical process listing page for the counter, such as page `1` and page size `1`, because only `total` is needed. Alternative considered: load the default process page; that would fetch unnecessary row data on every app-shell render.
- Render the badge only when the count query has a successful numeric `total`. During loading or error states, omit the badge so the UI does not imply a real count. For a successful empty listing, render `0` because that is the truthful count.
- Keep active navigation logic unchanged. The counter fix should not affect route matching for `/app/processos` or `/app/processo/*`.

## Risks / Trade-offs

- Extra sidebar query on authenticated app screens -> Use the minimal page size and rely on TanStack Query caching.
- Counter could briefly disappear while refetching -> Keep the previous successful value when the query library provides it, but do not introduce hardcoded fallback data.
- API failures remove the badge instead of showing a stale value -> Prefer no count over misleading navigation data.

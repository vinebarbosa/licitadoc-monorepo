## 1. Filter Model Helpers

- [x] 1.1 Add a typed documents listing filter model covering `search`, `typeFilter`, and `statusFilter`.
- [x] 1.2 Implement `getDefaultDocumentsFilters(searchParams)` to normalize `tipo`, `status`, and `search` query values.
- [x] 1.3 Implement `getDocumentsFilterSearchParams(filters)` to omit default values and serialize relevant filters.
- [x] 1.4 Add unit tests for valid params, invalid params, whitespace search, and default omission.

## 2. Documents Listing Integration

- [x] 2.1 Update `DocumentsListingPage` to derive filters from `useSearchParams` instead of one-time local filter state.
- [x] 2.2 Update search, type, and status controls to call a route-update helper that writes filter changes with `setSearchParams`.
- [x] 2.3 Ensure `filterDocuments` receives the route-derived filters and updates rows when the route changes after mount.
- [x] 2.4 Preserve the current visual layout, labels, empty/error/loading states, and document action affordances.

## 3. Sidebar and Route Behavior Coverage

- [x] 3.1 Add component coverage for opening `/app/documentos?tipo=tr` with the type select and rows matching `TR`.
- [x] 3.2 Add component coverage for changing the page type/status/search filters and verifying URL updates.
- [x] 3.3 Add coverage for invalid query values falling back to `Todos` without select errors.
- [x] 3.4 Add coverage or a route-level smoke check showing sidebar document type links update an already-mounted documents page.

## 4. Validation

- [x] 4.1 Run the focused frontend unit/component tests for documents and sidebar behavior.
- [x] 4.2 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 4.3 Manually verify `/app/documentos?tipo=tr`, sidebar ETP/TR/Minuta clicks, status filter, search filter, and URL cleanup in the browser.

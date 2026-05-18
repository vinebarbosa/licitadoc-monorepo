## 1. Data Hook

- [x] 1.1 Add or reuse a process module hook for the sidebar count that requests the process listing with the smallest practical page size and reads `total`.
- [x] 1.2 Export the count hook or existing listing hook through `apps/web/src/modules/processes/index.ts` if the app shell needs it.

## 2. Sidebar Implementation

- [x] 2.1 Remove the hardcoded `badge: "5"` from `mainNavItems` in `AppSidebar`.
- [x] 2.2 Render the Processos badge from the latest successful numeric process `total`.
- [x] 2.3 Keep the Processos item badge-free during loading and failed count states, while rendering `0` for a successful empty listing.
- [x] 2.4 Preserve existing sidebar active-route matching, collapse behavior, and unrelated navigation items.

## 3. Verification

- [x] 3.1 Extend `AppSidebar` tests to assert a successful API-backed process count replaces the former hardcoded value.
- [x] 3.2 Add coverage for zero, loading, and error states so no mock fallback count appears.
- [x] 3.3 Run the focused web test file for `AppSidebar`.
- [x] 3.4 Run the relevant frontend validation command if available in the package workflow.

## 1. API Usage Aggregation

- [x] 1.1 Create the API module, route registration, query schemas, response schemas, and admin-only authorization for `GET /api/admin/ai-usage`.
- [x] 1.2 Implement pure metadata normalizers for generation run cost, usage, call count, occurrence date, document type, and organization fallback values.
- [x] 1.3 Implement the aggregation service over `document_generation_runs` with joins for documents, processes, and organizations.
- [x] 1.4 Return summary metrics, trend points, grouped breakdowns, and paginated run rows from a single endpoint response.
- [x] 1.5 Add or evaluate date/status indexes for `document_generation_runs` if the final query needs them.

## 2. API Tests and Client

- [x] 2.1 Add API tests for admin access, non-admin rejection, default period behavior, filters, pagination, and unknown-cost handling.
- [x] 2.2 Add focused tests for metadata normalizers using pipeline metadata, final-call metadata, missing usage, zero cost, and unknown cost.
- [x] 2.3 Regenerate `@licitadoc/api-client` after the OpenAPI schema includes the new endpoint.

## 3. Web Route and Data Model

- [x] 3.1 Create `apps/web/src/modules/ai-usage` with API hooks, formatting helpers, filter parsing, and stable query-param serialization.
- [x] 3.2 Register `/admin/ia/uso` behind `AdminOnlyRoute` with breadcrumb `Admin > Uso de IA`.
- [x] 3.3 Add the sidebar admin item "Uso de IA" with a lucide icon and active-state behavior matching existing admin items.

## 4. Dashboard Interface

- [x] 4.1 Review the completed v0 chat `gX2iCfYAIRy` and adapt its layout direction into local shadcn/Tailwind components instead of copying incompatible code.
- [x] 4.2 Build the dashboard shell with header, period controls, filter toolbar, refresh action, and responsive layout.
- [x] 4.3 Build KPI cards for known spend, average cost, generated documents, total tokens, cached input share, and failure rate.
- [x] 4.4 Build the cost trend chart using the existing `ChartContainer`, `ChartTooltip`, and `recharts` dependency.
- [x] 4.5 Build breakdown tabs or segmented controls for model, provider, document type, organization, and status.
- [x] 4.6 Build the paginated run table with status/model/provider badges, cost formatting, unknown-cost indicator, and document/process links when available.
- [x] 4.7 Implement loading, empty, and error states with stable dimensions and copy in Brazilian Portuguese.

## 5. Verification

- [x] 5.1 Add web tests for route authorization, filter URL state, loading/empty/error states, KPI rendering, and table pagination.
- [x] 5.2 Run focused API tests, web tests, typecheck, and API client generation checks.
- [x] 5.3 Start the web app and verify the page in browser on desktop and mobile widths, checking that filters, cards, chart, and table do not overlap.

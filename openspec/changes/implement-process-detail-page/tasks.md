## 1. API Detail Contract

- [x] 1.1 Extend process detail serialization with compact organization context.
- [x] 1.2 Ensure process detail summary and native items support the validated UI sections.
- [x] 1.3 Update process detail schemas/OpenAPI examples and regenerate the API client if needed.
- [x] 1.4 Add or update API tests for organization context, item summary, and document card metadata.

## 2. Web Detail Page

- [x] 2.1 Implement `ProcessDetailPageContent` loading the route `processId` with `useProcessDetail`.
- [x] 2.2 Port the validated demo layout to API-backed data for header, summary, info, institutional context, dates, and documents.
- [x] 2.3 Render native solicitation items, including expandable kit components and defensive value formatting.
- [x] 2.4 Implement loading, retryable error, forbidden/not-found, and missing-id states.
- [x] 2.5 Wire document and edit actions to existing app routes, with toast-backed placeholders for unavailable secondary actions.

## 3. Tests and Verification

- [x] 3.1 Restore/add process detail page tests for the validated layout, item rendering, document actions, and failure states.
- [x] 3.2 Update MSW fixtures and router tests for the final API response shape.
- [x] 3.3 Run focused API and web tests and fix regressions.
- [x] 3.4 Mark tasks complete after verification.

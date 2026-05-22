## 1. Backend Contracts

- [x] 1.1 Add organization visual asset fields, migration, serializers, schemas, and upload/read routes for logo, crest, and paper letterhead template files.
- [x] 1.2 Add invite revoke and resend service functions, route schemas, routes, permissions, and tests.
- [x] 1.3 Add department delete service function, route schema, route, permission coverage, and tests.

## 2. Generated Contracts

- [x] 2.1 Regenerate API OpenAPI/Postman contracts after route schema changes.
- [x] 2.2 Regenerate `@licitadoc/api-client` and normalize generated imports.

## 3. Web Integration

- [x] 3.1 Add organization workspace API/model adapters for organization profile, members, invites, departments, and organization assets.
- [x] 3.2 Replace mock-backed workspace state with API-backed queries/mutations while preserving the validated layout.
- [x] 3.3 Add loading, empty, retry, save, upload, and mutation error states for each tab.
- [x] 3.4 Update MSW fixtures/handlers and owner organization/router tests for API-backed behavior.

## 4. Verification

- [x] 4.1 Run focused API tests for organizations, invites, and departments.
- [x] 4.2 Run focused web tests for the owner organization workspace and route.
- [x] 4.3 Run typecheck and focused lint/format checks for touched packages.
- [x] 4.4 Validate OpenSpec change `connect-owner-organization-workspace-api`.

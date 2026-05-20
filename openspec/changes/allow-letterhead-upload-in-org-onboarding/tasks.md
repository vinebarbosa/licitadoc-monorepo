## 1. API Contract

- [x] 1.1 Extend organization onboarding schema/route to accept optional multipart `letterhead` alongside the existing prefeitura fields.
- [x] 1.2 Preserve valid no-file organization onboarding behavior for existing JSON or text-only submissions.
- [x] 1.3 Update OpenAPI examples/types for onboarding with and without letterhead.

## 2. Backend Implementation

- [x] 2.1 Refactor organization letterhead validation/storage helpers so onboarding can reuse the same supported MIME, size, storage key, and serializer behavior.
- [x] 2.2 Update organization creation to associate a submitted valid letterhead with the newly created organization before onboarding is considered complete.
- [x] 2.3 Ensure invalid or failed onboarding letterhead uploads reject the request and leave the owner able to retry organization onboarding.
- [x] 2.4 Add API tests for onboarding without letterhead, onboarding with a valid letterhead, invalid file rejection, and storage failure/rollback behavior.

## 3. API Client

- [x] 3.1 Regenerate `@licitadoc/api-client` after the organization onboarding contract changes.
- [x] 3.2 Update onboarding API wrappers/hooks to pass optional `File` data without leaking multipart details into page components.

## 4. Web Onboarding UI

- [x] 4.1 Add optional letterhead file state to the owner organization onboarding view, including choose, preview or file summary, remove, and skip states.
- [x] 4.2 Add client-side validation feedback for unsupported, empty, too-large, or multiple-file selections while preserving entered prefeitura fields.
- [x] 4.3 Submit organization fields and the optional selected file through the onboarding mutation, then refresh session and navigate into `/app` only after success.
- [x] 4.4 Surface API letterhead validation/storage errors on the organization onboarding screen without clearing typed organization data.

## 5. Verification

- [x] 5.1 Add/update web tests for organization onboarding with no file, valid file, file removal before submit, local validation failure, and API rejection.
- [x] 5.2 Run focused API tests for organizations/users and focused web onboarding tests.
- [x] 5.3 Run typecheck or the closest existing validation command for touched API, client, and web packages.

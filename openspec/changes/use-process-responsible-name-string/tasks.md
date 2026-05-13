## 1. API Contract

- [x] 1.1 Update process schemas and OpenAPI examples to expose `responsibleName` instead of `responsibleUserId` in native process create, update, list, and detail payloads.
- [x] 1.2 Update process create/update handlers to persist trimmed `responsibleName` and stop validating responsible user organization membership for native process requests.
- [x] 1.3 Update process serializers, document context mapping, and tests/fixtures to use the persisted responsible name as the public process responsible field.
- [x] 1.4 Regenerate the API client after the API schema changes.

## 2. Web Process Create Flow

- [x] 2.1 Remove process-create-page user-list loading and `useProcessUsersList` dependency.
- [x] 2.2 Replace the responsible select with a required text input while preserving the demo-aligned layout and validation behavior.
- [x] 2.3 Submit `responsibleName` in the process create payload and update summary/review rendering to use the typed string.
- [x] 2.4 Update process listing/detail UI and model helpers where they still display `responsibleUserId`.

## 3. Tests and Verification

- [ ] 3.1 Update API and web tests for the free-text responsible contract.
- [ ] 3.2 Run focused process API tests and web process creation tests.
- [x] 3.3 Run typecheck and formatting/lint checks for touched packages.

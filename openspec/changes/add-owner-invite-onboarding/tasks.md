## 1. Data Model And Auth Context

- [x] 1.1 Add user onboarding status and temporary-password metadata to the API database schema and migration.
- [x] 1.2 Expose onboarding status through Better Auth additional user/session fields and generated user response schemas.
- [x] 1.3 Add auth credential helpers for creating temporary passwords and replacing them during profile setup.

## 2. Owner Invite Provisioning

- [x] 2.1 Update admin organization-owner invite creation to provision a pending owner user with temporary credentials and no organization.
- [x] 2.2 Update invite records and serializers to expose provisioned user/onboarding lifecycle information.
- [x] 2.3 Update invite e-mail content to include the system sign-in link and temporary password for owner invites.
- [x] 2.4 Preserve or adjust member invite token redemption without routing owner onboarding through token acceptance.

## 3. Profile And Organization Onboarding API

- [x] 3.1 Add a self-service profile/password onboarding endpoint for invited owners in `pending_profile`.
- [x] 3.2 Extend organization creation onboarding to require `pending_organization`, link the created organization, and mark onboarding `complete`.
- [x] 3.3 Ensure session reads after profile and organization mutations return the updated onboarding status and organization context.

## 4. Web Onboarding Flow

- [x] 4.1 Regenerate the API client after backend contract changes.
- [x] 4.2 Extend web auth session model and route guards with onboarding status redirects.
- [x] 4.3 Build owner profile onboarding UI for name and new password.
- [x] 4.4 Build organization onboarding UI using the existing prefeitura fields and navigate to `/app` after completion.
- [x] 4.5 Update sign-in success handling to route invited owners to the first incomplete onboarding step.

## 5. Tests And Verification

- [x] 5.1 Add API unit tests for owner invite provisioning, conflict handling, temporary-password delivery, and token-acceptance rejection for owner invites.
- [x] 5.2 Add API unit tests for profile onboarding and organization onboarding status transitions.
- [x] 5.3 Update invite E2E coverage for temporary credential sign-in and full owner onboarding completion.
- [x] 5.4 Add web tests for onboarding route guards, profile step, organization step, and completed-user redirects.
- [x] 5.5 Run API migrations, focused API tests, web tests, typecheck, and affected OpenAPI/client generation checks.

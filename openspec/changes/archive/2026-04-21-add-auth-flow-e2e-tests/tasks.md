## 1. E2E Harness

- [x] 1.1 Add a dedicated `apps/api` script to run auth E2E tests separately from the existing module test suite
- [x] 1.2 Create E2E test utilities that boot the Fastify app on an ephemeral local port, resolve the runtime base URL, and shut the server down reliably
- [x] 1.3 Implement a minimal cookie jar helper that captures `set-cookie` headers and reuses the session cookie on follow-up requests
- [x] 1.4 Add isolated auth test setup and cleanup for the required user, account, and session state so repeated runs stay deterministic

## 2. Auth Flow Coverage

- [x] 2.1 Add the happy-path E2E scenario for email sign-up and assert the configured auto sign-in behavior creates a reusable session
- [x] 2.2 Add session retrieval coverage through the real auth session endpoint using the cookie issued by the happy-path flow
- [x] 2.3 Add protected-route coverage against an existing authenticated route and assert the signed-in user reaches the application layer successfully
- [x] 2.4 Add sign-out coverage and assert the previously valid session no longer authorizes the same protected route afterward
- [x] 2.5 Add negative scenarios for unauthenticated protected-route access and email/password sign-in with invalid credentials

## 3. Verification

- [x] 3.1 Document the local and CI environment required to run auth E2E tests, including the dedicated test database configuration
- [x] 3.2 Run the new auth E2E test command and keep the existing `apps/api` automated tests green
- [x] 3.3 Run lint and typecheck for `apps/api` after the E2E coverage changes land

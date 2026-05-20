## 1. Contract Scripts

- [x] 1.1 Add a root `contracts:generate` script that runs `@licitadoc/api` OpenAPI generation before `@licitadoc/api-client` generation.
- [x] 1.2 Add a root `contracts:check` script that runs generation and fails when generated API contract artifacts have uncommitted changes.
- [x] 1.3 Keep the checked paths scoped to the generated OpenAPI and API client artifacts.

## 2. Pre-Push Guard

- [x] 2.1 Add a repository-managed pre-push hook script that runs the contract check command.
- [x] 2.2 Add an install/setup script or documented command that copies or links the pre-push hook into `.git/hooks`.
- [x] 2.3 Make the hook output explain how to regenerate and commit artifacts when it blocks a push.

## 3. Documentation

- [x] 3.1 Document when developers should run the contract generation command manually.
- [x] 3.2 Document how to install the local pre-push guard in an existing clone.
- [x] 3.3 Document the standard `git push --no-verify` bypass path for exceptional pushes.

## 4. Verification

- [x] 4.1 Run the contract generation command and confirm it succeeds.
- [x] 4.2 Run the contract check command and confirm it succeeds from a clean generated state.
- [x] 4.3 Confirm no GitHub Actions or Vercel CI step was added for this guard.

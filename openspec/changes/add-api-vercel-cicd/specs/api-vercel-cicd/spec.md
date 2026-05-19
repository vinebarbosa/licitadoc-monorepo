## ADDED Requirements

### Requirement: API CI validation
The system SHALL run a GitHub Actions validation job for API changes before attempting any Vercel deployment.

#### Scenario: API validation succeeds
- **WHEN** a pull request or `main` push changes API, workspace, or deployment configuration files
- **THEN** the workflow installs dependencies with pnpm and runs API typecheck, build, and tests successfully before any deploy job starts

#### Scenario: API validation fails
- **WHEN** typecheck, build, or tests fail
- **THEN** the workflow fails without creating a Vercel deployment

### Requirement: Preview deployment to Vercel
The system SHALL create a Vercel Preview deployment for eligible non-production API workflow runs after validation succeeds.

#### Scenario: Pull request preview deploy
- **WHEN** a pull request workflow run passes API validation and Vercel secrets are available
- **THEN** the workflow builds the Vercel project from `apps/api` and deploys the prebuilt output as a Preview deployment

#### Scenario: Preview deploy skipped without secrets
- **WHEN** a pull request workflow run does not have access to Vercel secrets
- **THEN** the workflow still reports validation status and skips the Preview deploy without exposing secret values

### Requirement: Production deployment to Vercel
The system SHALL create a Vercel Production deployment only from successful API workflow runs on `main`.

#### Scenario: Main branch production deploy
- **WHEN** a push to `main` passes API validation
- **THEN** the workflow builds the Vercel project from `apps/api` with the production environment and deploys the prebuilt output with the production target

#### Scenario: Non-main branch cannot deploy production
- **WHEN** the workflow runs for a branch or pull request that is not `main`
- **THEN** the workflow MUST NOT execute the production deploy step

### Requirement: Vercel authentication and project targeting
The system SHALL use GitHub repository secrets to authenticate Vercel CLI and target the API Vercel project.

#### Scenario: Required Vercel secrets exist
- **WHEN** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are configured in GitHub
- **THEN** the workflow can pull Vercel environment/project settings and deploy the API project without interactive prompts

#### Scenario: Required Vercel secret missing
- **WHEN** a required Vercel secret is missing
- **THEN** the deploy job fails before deployment with a clear GitHub Actions failure

### Requirement: Single source of deployment truth
The system SHALL prevent duplicate API deployments from Vercel's Git integration when GitHub Actions owns API CD.

#### Scenario: GitHub Actions owns deploy
- **WHEN** a commit or pull request triggers the API workflow
- **THEN** the Vercel deployment is created by the GitHub Actions Vercel CLI steps, not by an independent automatic Git deployment from Vercel

### Requirement: Manual API deployment
The system SHALL allow maintainers to manually run the API deployment workflow from GitHub Actions.

#### Scenario: Manual preview deployment
- **WHEN** a maintainer runs the workflow manually without selecting production
- **THEN** the workflow validates the API and creates a Preview deployment

#### Scenario: Manual production deployment
- **WHEN** a maintainer runs the workflow manually with production selected on an allowed branch
- **THEN** the workflow validates the API and creates a Production deployment

## 1. Workflow Foundation

- [x] 1.1 Create `.github/workflows/api-vercel.yml` with triggers for `pull_request`, `push` to `main`, and `workflow_dispatch`.
- [x] 1.2 Configure the workflow to use Node.js 24, Corepack, pnpm cache, and `pnpm install --frozen-lockfile`.
- [x] 1.3 Add path filters or job conditions so API CI/CD runs for API, workspace, lockfile, Turbo, and workflow changes.

## 2. API Validation

- [x] 2.1 Add a validation job that runs `pnpm --filter @licitadoc/api typecheck`.
- [x] 2.2 Add a validation step that runs `pnpm --filter @licitadoc/api build`.
- [x] 2.3 Add a validation step that runs `pnpm --filter @licitadoc/api test`.
- [x] 2.4 Ensure deploy jobs depend on the validation job and do not run when validation fails.

## 3. Vercel Preview Deploy

- [x] 3.1 Add a Preview deploy job that installs `vercel@latest` after validation passes.
- [x] 3.2 Configure Preview deploy to run `vercel pull --yes --environment=preview --cwd apps/api`.
- [x] 3.3 Configure Preview deploy to run `vercel build --cwd apps/api`.
- [x] 3.4 Configure Preview deploy to run `vercel deploy --prebuilt --cwd apps/api` and expose the deployment URL in the job summary.
- [x] 3.5 Skip Preview deploy safely when Vercel secrets are unavailable, while keeping validation active.

## 4. Vercel Production Deploy

- [x] 4.1 Add a Production deploy job that runs only for pushes to `main` or explicit allowed manual production runs.
- [x] 4.2 Configure Production deploy to run `vercel pull --yes --environment=production --cwd apps/api`.
- [x] 4.3 Configure Production deploy to run `vercel build --prod --cwd apps/api`.
- [x] 4.4 Configure Production deploy to run `vercel deploy --prebuilt --prod --cwd apps/api` and expose the deployment URL in the job summary.

## 5. Deployment Ownership and Documentation

- [x] 5.1 Add API Vercel project configuration to disable automatic Git deployments for the API project.
- [x] 5.2 Document required GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.
- [x] 5.3 Document which API runtime environment variables remain configured in Vercel.
- [x] 5.4 Document rollback: disable the workflow and re-enable Vercel Git deployments.

## 6. Verification

- [x] 6.1 Run `pnpm --filter @licitadoc/api typecheck` locally.
- [x] 6.2 Run `pnpm --filter @licitadoc/api build` locally.
- [x] 6.3 Validate the workflow YAML syntax and GitHub Actions expressions.
- [x] 6.4 Verify OpenSpec status marks the change apply-ready.

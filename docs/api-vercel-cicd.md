# API Vercel CI/CD

The API deploy pipeline is owned by GitHub Actions in `.github/workflows/api-vercel.yml`.

The workflow validates `apps/api` first, then deploys to Vercel with the CLI:

```bash
vercel pull
vercel build
vercel deploy --prebuilt
```

## GitHub Secrets

Configure these repository secrets in GitHub:

- `VERCEL_TOKEN`: Vercel API token used by the CLI.
- `VERCEL_ORG_ID`: Vercel team/user id that owns the API project.
- `VERCEL_PROJECT_ID`: Vercel project id for the API project.

Do not put API runtime secrets in GitHub just for deployment. Keep runtime and build-time application variables in the Vercel API project.

## Vercel Environment Variables

The API project in Vercel remains responsible for application variables, including:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CORS_ORIGIN`
- `STORAGE_PROVIDER`
- `STORAGE_S3_ENDPOINT`
- `STORAGE_S3_REGION`
- `STORAGE_S3_BUCKET`
- `STORAGE_S3_ACCESS_KEY_ID`
- `STORAGE_S3_SECRET_ACCESS_KEY`
- `STORAGE_S3_FORCE_PATH_STYLE`
- `REALTIME_PROVIDER`
- `ABLY_API_KEY`

The workflow runs `vercel pull` before `vercel build`, so Vercel project settings and environment variables are available to the build step.

## Deployment Behavior

- Pull requests run validation and create a Preview deployment when Vercel secrets are available.
- Pull requests from forks still run validation, but Preview deployment is skipped because GitHub does not expose repository secrets to those runs.
- Pushes to `main` run validation and create a Production deployment.
- Manual `workflow_dispatch` runs can deploy Preview or Production. Manual Production deploy only runs from `main`.

## Avoiding Duplicate Deployments

`apps/api/vercel.json` sets:

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

That disables automatic Git deployments for the API Vercel project so GitHub Actions is the only deployment path.

Confirm the API project in the Vercel dashboard is using `apps/api` as its Root Directory. If the dashboard still creates Git deployments, disable the Git integration deployment behavior from the project settings as well.

## Rollback

To roll back to Vercel-managed deploys:

1. Disable `.github/workflows/api-vercel.yml` in GitHub Actions or remove the workflow.
2. Remove or change `apps/api/vercel.json` so `git.deploymentEnabled` is no longer `false`.
3. Re-enable automatic Git deployments in the Vercel dashboard if needed.

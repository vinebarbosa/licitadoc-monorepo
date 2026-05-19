# API Container Deployment

This guide describes how to build and run the Licitadoc API as a production container image.

## Image Build

Build from the repository root so Docker has access to the pnpm workspace and lockfile:

```bash
docker build -f apps/api/Dockerfile -t licitadoc-api:local .
```

The image uses Node 24 on Debian, installs dependencies from `pnpm-lock.yaml`, builds `@licitadoc/api`, and starts the compiled server with:

```bash
node dist/app/server.js
```

The runtime image does not copy `.env` files, host `node_modules`, local caches, or the full development workspace.

## Local Run With Compose

The root `docker-compose.yml` includes an optional API service behind the `api` profile. It runs against the existing `postgres` and `ministack` services using Docker-network hostnames:

```bash
docker compose --profile api up --build api
```

The local API will listen on `http://localhost:3333`.

Verify health:

```bash
curl http://localhost:3333/health
```

Expected response:

```json
{"status":"ok"}
```

## Local Run Without Compose

If Postgres and MiniStack are already running on the host, build the image and run it directly:

```bash
docker build -f apps/api/Dockerfile -t licitadoc-api:local .

docker run --rm \
  -p 3333:3333 \
  -e NODE_ENV=production \
  -e HOST=0.0.0.0 \
  -e PORT=3333 \
  -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/licitadoc \
  -e BETTER_AUTH_SECRET=local-container-dev-secret-change-me-please-32-bytes \
  -e BETTER_AUTH_URL=http://localhost:3333 \
  -e CORS_ORIGIN=http://localhost:5173 \
  -e INVITE_EMAIL_PROVIDER=stub \
  -e TEXT_GENERATION_PROVIDER=stub \
  -e STORAGE_PROVIDER=s3 \
  -e STORAGE_S3_ENDPOINT=http://host.docker.internal:4566 \
  -e STORAGE_S3_REGION=us-east-1 \
  -e STORAGE_S3_BUCKET=licitadoc-expense-requests \
  -e STORAGE_S3_ACCESS_KEY_ID=test \
  -e STORAGE_S3_SECRET_ACCESS_KEY=test \
  -e STORAGE_S3_FORCE_PATH_STYLE=true \
  -e REALTIME_PROVIDER=disabled \
  licitadoc-api:local
```

On Linux, `host.docker.internal` may require adding `--add-host=host.docker.internal:host-gateway`.

## Database Migrations

Migrations are intentionally explicit and are not run by the API container on startup. Run them before switching traffic to a new image:

```bash
cd apps/api
DATABASE_URL=postgres://postgres:postgres@localhost:5432/licitadoc pnpm db:migrate
```

For production, run the same command from a trusted checkout or CI job with the production `DATABASE_URL` configured. This avoids multiple API replicas attempting schema changes during restarts or scale-out.

## Production Environment Variables

Provide deployment values at runtime. Do not bake secrets into the image.

Required or commonly configured:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Use `production` in deployed containers. |
| `HOST` | Bind host. Use `0.0.0.0` for container platforms. |
| `PORT` | Port exposed by the container host. Defaults to `3333`. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `BETTER_AUTH_SECRET` | Better Auth server secret. |
| `BETTER_AUTH_URL` | Public API/auth origin. |
| `CORS_ORIGIN` | Allowed web frontend origin. |
| `STORAGE_PROVIDER` | Usually `s3`. |
| `STORAGE_S3_ENDPOINT` | S3-compatible endpoint when not using AWS default endpoints. |
| `STORAGE_S3_REGION` | S3 region. |
| `STORAGE_S3_BUCKET` | Bucket for uploaded files. |
| `STORAGE_S3_ACCESS_KEY_ID` | Storage access key. |
| `STORAGE_S3_SECRET_ACCESS_KEY` | Storage secret key. |
| `STORAGE_S3_FORCE_PATH_STYLE` | Use `true` for MiniStack and many S3-compatible services. |
| `TEXT_GENERATION_PROVIDER` | `stub`, `openai`, or `ollama`. |
| `TEXT_GENERATION_MODEL` | Model identifier for the selected provider. |
| `TEXT_GENERATION_API_KEY` | API key for hosted text generation providers. |
| `TEXT_GENERATION_BASE_URL` | Custom provider base URL when needed. |
| `TEXT_GENERATION_TIMEOUT_MS` | Optional request timeout for long document generation. |
| `INVITE_EMAIL_PROVIDER` | `stub` or `resend`. |
| `RESEND_API_KEY` | Required when using Resend. |
| `RESEND_FROM_EMAIL` | Sender used by Resend. |
| `REALTIME_PROVIDER` | `disabled` or `ably`. |
| `ABLY_API_KEY` | Required when using Ably. |
| `REALTIME_TOKEN_TTL_MS` | Realtime token lifetime. |
| `EXPENSE_REQUEST_PDF_MAX_BYTES` | Optional PDF upload size limit. |
| `SUPPORT_IMAGE_MAX_BYTES` | Optional support image upload size limit. |

## Healthcheck

The Dockerfile includes a healthcheck that calls:

```text
GET /health
```

Container platforms should use the same path for readiness/liveness checks. A healthy response returns HTTP 200 with `{"status":"ok"}`.

## Host Platform Notes

The API is a long-running Fastify process. Prefer a container host that supports:

- long-lived HTTP requests compatible with current document-generation timeouts
- enough memory for PDF parsing and native canvas dependencies
- external PostgreSQL and S3-compatible storage
- explicit pre-deploy migration jobs or release commands
- rollback to a previous image tag

Suggested rollout:

1. Build and tag the image.
2. Run migrations against the target database.
3. Deploy the image with production env vars.
4. Verify `/health` and a representative authenticated request.
5. Roll back by redeploying the previous image tag if startup or runtime checks fail.

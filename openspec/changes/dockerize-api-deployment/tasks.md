## 1. Container Build

- [x] 1.1 Add an API-specific Dockerfile that builds from the repository root with a Debian-based Node 24 image.
- [x] 1.2 Implement a multi-stage pnpm build that installs from `pnpm-lock.yaml`, builds `@licitadoc/api`, and prepares production runtime contents only.
- [x] 1.3 Ensure the runtime container starts the compiled API with `NODE_ENV=production` and `node dist/app/server.js`.
- [x] 1.4 Ensure the runtime image does not copy `.env` files, local caches, `node_modules`, or unrelated build artifacts from the host.
- [x] 1.5 Add a container healthcheck or documented healthcheck command that verifies `/health`.

## 2. Local Container Workflow

- [x] 2.1 Extend local Docker Compose with an optional API service that builds the API image from the root context.
- [x] 2.2 Configure the local API service to connect to the existing Compose Postgres and MiniStack services through container-network hostnames.
- [x] 2.3 Keep database migrations as an explicit command and document how to run them in the container workflow.
- [x] 2.4 Confirm the API container honors `HOST=0.0.0.0` and the configured `PORT` for local and platform deployments.

## 3. Deployment Documentation

- [x] 3.1 Document the image build command, local run command, and Compose workflow.
- [x] 3.2 Document required production environment variables for database, auth, CORS, storage, text generation, mail, realtime, host, and port.
- [x] 3.3 Document the healthcheck path, explicit migration step, and rollback strategy for generic container hosts.
- [x] 3.4 Note platform expectations for long-running API requests and background generation work.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @licitadoc/api typecheck`.
- [x] 4.2 Run `pnpm --filter @licitadoc/api build`.
- [x] 4.3 Build the API Docker image locally with the documented command.
- [x] 4.4 Run the API container against local dependencies and verify `/health` returns `status: ok`.
- [x] 4.5 Verify the production image can import the API route graph and include native PDF dependencies needed by `pdfjs-dist`.

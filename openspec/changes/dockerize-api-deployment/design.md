## Context

`@licitadoc/api` is a Fastify application in a pnpm monorepo. It already builds to `apps/api/dist`, starts from `apps/api/src/app/server.ts` in development, and exposes `/health`. Runtime configuration is centralized in `apps/api/src/plugins/env.ts`, with defaults for local development and environment variables for production services such as Postgres, S3-compatible storage, auth, text generation, mail, and realtime.

The immediate deployment pressure is that Vercel's serverless packaging is not running the API reliably. A container image shifts the production contract from platform-specific function tracing to a normal long-running Node process where native dependencies, workspace build output, and runtime environment variables can be controlled explicitly.

## Goals / Non-Goals

**Goals:**
- Produce a reproducible Docker image for `@licitadoc/api` using Node 24 and pnpm.
- Build the API from the monorepo and run the compiled server in production mode.
- Keep all secrets and deployment-specific values as runtime environment variables.
- Include or document a health verification path using the existing `/health` endpoint.
- Provide a local workflow to build and run the API container against the existing Postgres and MiniStack services.
- Make the image suitable for generic container hosts such as Render, Fly.io, Railway, Cloud Run, ECS, or a VPS.

**Non-Goals:**
- Rewriting API routes or changing public API contracts.
- Replacing Postgres, S3-compatible storage, auth, text-generation, mail, or realtime providers.
- Bundling the web frontend into the API container.
- Automatically running database migrations on every API start.
- Choosing and configuring one final hosting vendor in this change.

## Decisions

### Decision: Use a standard Node 24 production container

The API should run on a Debian-based Node 24 image, not Alpine. Node 24 matches the current Vercel setting and satisfies `pdfjs-dist` engine requirements. A Debian-based image gives native Node packages a more predictable glibc environment than Alpine/musl.

Alternatives considered:
- `node:24-alpine`: smaller, but increases native-package risk around packages such as `@napi-rs/canvas`.
- Distroless Node image: leaner runtime, but less convenient for early deployment debugging and healthcheck tooling.
- Keeping Vercel serverless: preserves the existing hosting path, but keeps the application exposed to function tracing and native dependency packaging issues.

### Decision: Build from the repository root with an API-specific Dockerfile

The Docker build should use the repository root as context and an API-specific Dockerfile, for example `docker build -f apps/api/Dockerfile .`. This lets the image access `pnpm-workspace.yaml`, `pnpm-lock.yaml`, root package metadata, shared TypeScript config, and the API package without copying unrelated local artifacts.

Alternatives considered:
- Build context `apps/api`: simpler Docker command, but loses monorepo workspace and lockfile context.
- Root-only `Dockerfile`: works, but makes it harder to distinguish API deployment from future web or worker images.

### Decision: Multi-stage build with production runtime contents only

The Dockerfile should install dependencies with `pnpm install --frozen-lockfile`, build `@licitadoc/api`, and copy only the compiled API, package metadata, lockfile/workspace metadata as needed, and production dependencies into the runtime stage. The runtime stage should start `node dist/app/server.js` from `apps/api` or an equivalent isolated API directory.

Alternatives considered:
- Runtime image with full repository and dev dependencies: fastest to write, but larger and leaks build-only files into production.
- Runtime image produced by an external bundler: could be smaller, but adds new tooling and risk before the deployment path is stable.

### Decision: Runtime environment stays outside the image

The image must not bake secrets or environment-specific URLs. Deployment platforms should provide `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, storage credentials, text-generation settings, mail settings, realtime settings, and `PORT`/`HOST` as environment variables.

Alternatives considered:
- Copy `.env` into the image: convenient locally, but unsafe for production and easy to deploy with stale secrets.
- Generate deployment-specific images: increases operational drift and makes rollback harder.

### Decision: Keep migrations explicit

Database migrations should remain an explicit command such as `pnpm --filter @licitadoc/api db:migrate` or an equivalent container command, not part of API process startup. This avoids every replica attempting schema changes during scale-out or restarts.

Alternatives considered:
- Run migrations in the entrypoint before starting the server: convenient for single-instance deployments, but risky with multiple instances and harder to roll back.
- Ignore migrations in container docs: leaves a common deployment failure mode undocumented.

## Risks / Trade-offs

- Native dependency mismatch on the host platform -> Use Debian-based Node 24 and verify the built image can import the API route graph and read PDFs before deploying.
- Larger image than serverless bundle -> Use multi-stage build and production dependency pruning/deploy to keep runtime contents focused.
- Runtime environment drift -> Document required production env vars and provide local examples for Postgres and MiniStack.
- Database schema not migrated before deploy -> Document migration as a separate pre-release step.
- Container host expects a dynamic port -> Ensure the server honors `PORT` and binds `HOST=0.0.0.0`.
- Long-running document generation can exceed platform limits -> Prefer container hosts with request and process limits compatible with current generation timeouts.

## Migration Plan

1. Add the Dockerfile, ignore file, scripts/docs, and optional compose service.
2. Build the image locally with the same pnpm lockfile used by the repository.
3. Run the API container against local Postgres and MiniStack, then verify `/health` and a representative API request.
4. Run migrations explicitly against the target database before switching production traffic.
5. Deploy the image to the chosen container host with production environment variables.
6. Roll back by redeploying the previous image tag or returning traffic to the previous API deployment.

## Open Questions

- Which container host will be used first for production testing?
- Should the repository include vendor-specific deployment files after the generic image works?
- Should CI build and publish the API image, or will local/manual image builds be enough for the first deployment?

# API Agent Guide

This file is the working guide for contributors and coding agents operating inside `apps/api`.

## Purpose

`apps/api` is the Fastify backend for Licitadoc. It owns:

- HTTP routes and request/response schemas
- authentication and session-aware authorization
- database access through Drizzle + PostgreSQL
- OpenAPI generation for the backend contract
- unit and E2E tests for backend behavior

The main runtime assembly lives in `src/app/build-app.ts`.

## Local Commands

Run these from `apps/api` unless noted otherwise.

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm generate:openapi
pnpm generate:postman
pnpm admin:create
```

Useful repo-level commands:

```bash
pnpm install
pnpm --filter @licitadoc/api-client generate
```

## Working Rules

- Keep changes close to the module that owns the behavior.
- Prefer changing route schemas and service logic before adding duplicate ad hoc validation.
- Preserve the existing Fastify plugin flow in `src/app/build-app.ts` unless a change explicitly needs a new bootstrap dependency.
- Treat OpenAPI output as derived from route schemas and plugin registration, not as a handwritten source of truth.
- Add or update tests with the code change. Unit tests live beside modules; E2E coverage lives under `test/`.
- Avoid test-only production routes. Current E2E coverage uses the real app plus seeded DB fixtures instead.

## Where To Change Things

### New or changed HTTP endpoints

- Register routes in `src/modules/<module>/routes.ts`.
- Define request/response schemas in `src/modules/<module>/<module>.schemas.ts`.
- Keep route handlers thin: parse request, resolve actor, delegate to service functions.

Examples:

- `src/modules/users/routes.ts`
- `src/modules/processes/routes.ts`
- `src/modules/documents/routes.ts`

### Business rules and persistence

- Put read/write behavior in module service files such as `get-users.ts`, `create-process.ts`, or `update-organization.ts`.
- Keep authorization checks in `*.policies.ts` when they are reusable or domain-specific.
- Use `*.shared.ts` for module-level helpers such as serialization, scoping helpers, and conflict translation.

### Authentication and actor resolution

- The Fastify auth plugin is registered in `src/plugins/auth.ts`.
- Auth integration is created from `src/shared/auth/auth.ts`.
- Session-to-actor resolution happens through `src/shared/auth/get-session-user.ts`.
- Most protected routes call `getSessionUser(request)` first and then pass the actor into service code.

### Database schema and migrations

- Drizzle schema exports live under `src/db/schema/*.ts`.
- Re-exports are centralized in `src/db/index.ts`.
- Drizzle migrations live under `src/db/migrations/`.
- Drizzle config lives in `drizzle.config.ts`.

If you change schema files, follow the usual flow:

```bash
pnpm db:generate
pnpm db:migrate
```

### App bootstrap and cross-cutting plugins

The application is assembled in `src/app/build-app.ts`. This is the place to inspect when you need to understand:

- plugin registration order
- route registration order
- health route behavior
- OpenAPI exposure via `/openapi.json`

Current cross-cutting plugins live in `src/plugins/`:

- `env.ts`: parses and decorates runtime config
- `db.ts`: creates the PostgreSQL pool and Drizzle client
- `auth.ts`: decorates the Better Auth instance
- `cors.ts`: CORS behavior
- `security.ts`: security-related Fastify setup
- `openapi.ts`: Fastify Swagger, Swagger UI, and merged auth OpenAPI docs
- `errors.ts`: application-wide error translation

## Test Strategy

### Unit tests

- Use `pnpm test` for module-level coverage.
- Existing module tests live beside the code, such as:
  - `src/modules/users/users.test.ts`
  - `src/modules/processes/processes.test.ts`
  - `src/modules/organizations/organizations.test.ts`

### E2E tests

- Use `pnpm test:e2e` for real HTTP coverage.
- E2E suites live under `test/`.
- Shared helpers live under `test/e2e/helpers/`.
- The reusable test server boots the real Fastify app from `test/e2e/helpers/test-server.ts`.

Current E2E suites:

- `test/auth-e2e/auth-flow.test.ts`
- `test/invite-e2e/invite-flow.test.ts`
- `test/user-e2e/user-flow.test.ts`
- `test/organization-e2e/organization-flow.test.ts`
- `test/department-e2e/department-flow.test.ts`
- `test/process-e2e/process-flow.test.ts`

If your change touches auth, role scope, persistence wiring, route schemas, or serialization, prefer adding or updating E2E coverage in addition to unit tests.

## Validation Checklist

Before wrapping a backend change, run the smallest sensible set of checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

If you changed HTTP behavior, auth flow, or fixture-dependent logic, also run:

```bash
pnpm test:e2e
```

If you changed route schemas or OpenAPI-relevant metadata, regenerate the backend outputs:

```bash
pnpm generate:openapi
pnpm generate:postman
```

## Change Boundaries

- Do not hand-edit `openapi/openapi.json` as a source artifact.
- Do not bypass module policies with route-local authorization hacks if the rule belongs to the domain.
- Do not add backend behavior only in tests without a production code path that justifies it.
- Do not move package-specific docs to the repo root unless the change explicitly broadens scope.

## Fast Orientation

When you are new to this package, start in this order:

1. `src/app/build-app.ts`
2. `src/plugins/`
3. `src/modules/<target-module>/routes.ts`
4. `src/modules/<target-module>/*.schemas.ts`
5. `src/modules/<target-module>/*.policies.ts` and service files
6. `src/db/schema/*.ts`
7. `test/` and neighboring `*.test.ts`

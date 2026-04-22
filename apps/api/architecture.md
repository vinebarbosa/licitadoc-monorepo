# API Architecture

This document maps the current architecture of `apps/api` and explains how requests move through the backend package today.

## Package Role

`apps/api` is a Fastify application that combines:

- Better Auth for authentication and session management
- Drizzle ORM over PostgreSQL for persistence
- `fastify-zod-openapi` for route schemas and OpenAPI generation
- module-oriented business logic for auth, invites, users, organizations, departments, processes, and documents

The backend entrypoint is `src/app/server.ts`, which starts the app returned by `src/app/build-app.ts`.

## Runtime Flow

The current request lifecycle starts from `buildApp()` in `src/app/build-app.ts`.

### 1. App creation

`buildApp()` creates a base Fastify instance, applies the Zod validator/serializer compilers, and registers the shared plugins.

### 2. Plugin registration

Plugins are currently registered in this order:

1. `@fastify/sensible`
2. `registerEnvPlugin`
3. `registerSecurityPlugin`
4. `registerCorsPlugin`
5. `registerDatabasePlugin`
6. `registerAuthPlugin`
7. `registerOpenApiPlugin`
8. `registerErrorPlugin`

This order matters because later plugins and routes depend on earlier decorators such as `app.config`, `app.db`, and `app.auth`.

### 3. Route registration

After plugins, the app mounts the route modules under `/api/*` prefixes:

- `/api/auth`
- `/api/invites`
- `/api/users`
- `/api/organizations`
- `/api/departments`
- `/api/processes`
- `/api/documents`

The app also exposes:

- `/health`
- `/openapi.json`

In development, `buildApp()` adds an `onResponse` hook for request logging.

## Plugin Responsibilities

### `src/plugins/env.ts`

- loads `.env` via `dotenv`
- validates environment variables with Zod
- decorates `app.config`

The documented config currently includes:

- `NODE_ENV`
- `HOST`
- `PORT`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CORS_ORIGIN`

### `src/plugins/db.ts`

- creates a `pg` connection pool from `app.config.DATABASE_URL`
- creates the Drizzle client with the exported schema from `src/db/index.ts`
- decorates `app.pg` and `app.db`
- closes the pool on app shutdown

### `src/plugins/auth.ts`

- creates the Better Auth instance from `src/shared/auth/auth.ts`
- decorates `app.auth`

### `src/plugins/openapi.ts`

- registers `fastify-zod-openapi`
- registers Fastify Swagger and Swagger UI
- merges auth OpenAPI data with route-schema OpenAPI data
- exposes Swagger UI at `/docs`
- decorates `app.getOpenApiDocument()`

### `src/plugins/errors.ts`

- translates Fastify validation errors into a normalized JSON payload
- translates custom `AppError` subclasses into consistent API errors
- logs and masks unknown failures as `internal_server_error`

## Module Structure

The package follows a module-oriented layout under `src/modules/`.

Typical files inside a module:

- `routes.ts`: Fastify route wiring
- `*.schemas.ts`: Zod route schemas and public request/response contracts
- `*.policies.ts`: authorization and access rules
- service files such as `get-users.ts`, `create-process.ts`, or `update-document.ts`
- `*.shared.ts`: reusable helpers local to the module
- `*.test.ts`: module-level unit tests

Examples:

- `src/modules/users/`
- `src/modules/organizations/`
- `src/modules/processes/`
- `src/modules/documents/`

## Auth and Authorization Layers

Protected routes usually follow the same pattern:

1. route handler calls `getSessionUser(request)` from `src/shared/auth/get-session-user.ts`
2. session data is converted into an `Actor`
3. actor and request input are passed into service code
4. module policies decide whether the actor can perform the action

This keeps route files thin and pushes most domain decisions into service and policy layers.

## Database Architecture

Drizzle schema files live in `src/db/schema/`.

Current exported schema groups include:

- `auth`
- `organizations`
- `departments`
- `processes`
- `documents`
- `invites`

`src/db/index.ts` re-exports these schema modules and acts as the shared schema entrypoint for the Drizzle client.

Migrations live in `src/db/migrations/`, and `drizzle.config.ts` points Drizzle Kit at:

- schema path: `./src/db/schema/*.ts`
- migration output: `./src/db/migrations`

## API Contract Generation

The API contract is derived from route schemas, not handwritten OpenAPI files.

Main pieces:

- route schemas use `fastify-zod-openapi`
- the OpenAPI plugin registers Swagger and Swagger UI
- `src/app/export-openapi.ts` exports the generated document
- `src/app/export-postman.ts` exports a Postman collection view of the same backend surface
- `src/app/build-app.ts` exposes `/openapi.json`

This means schema changes in route modules affect generated API documentation.

## Error Model

Domain and application failures are normalized through `src/plugins/errors.ts`.

The current model distinguishes:

- validation failures from Fastify
- known application errors derived from `src/shared/errors/app-error.ts`
- unexpected internal failures

For module work, prefer throwing the shared error classes under `src/shared/errors/` instead of ad hoc response objects.

## Test Architecture

### Unit tests

Module-local tests live beside backend code and usually validate:

- business rules
- policy behavior
- serialization helpers
- conflict translation

Examples:

- `src/modules/users/users.test.ts`
- `src/modules/processes/processes.test.ts`
- `src/modules/departments/departments.test.ts`

### E2E tests

HTTP-level coverage lives under `test/`.

The E2E stack uses:

- the real Fastify app booted from `test/e2e/helpers/test-server.ts`
- request helpers from `test/e2e/helpers/http.ts`
- cookie/session helpers from `test/e2e/helpers/auth.ts` and `cookie-jar.ts`
- fixture creation and cleanup from `test/e2e/helpers/fixtures.ts`

Existing suites cover:

- auth
- invites
- users
- organizations
- departments
- processes

This split is intentional: unit tests cover local logic deeply, while E2E tests verify the integration of auth, routing, persistence, and serialization.

## Extension Points

When adding backend behavior, the usual extension path is:

1. add or update schema in `src/modules/<module>/*.schemas.ts`
2. implement service logic in `src/modules/<module>/*.ts`
3. add or update policy logic if access rules change
4. wire the route in `src/modules/<module>/routes.ts`
5. add or update tests
6. regenerate OpenAPI outputs if the contract changed

If a change spans multiple modules, start from `src/app/build-app.ts` and the shared plugins to verify whether it belongs in a cross-cutting layer or in a domain module.

## Current Constraints

- OpenAPI output is derived and should not be treated as a handwritten source artifact.
- Role and scope decisions are session-aware and should stay centralized in auth helpers and module policies.
- E2E tests rely on a dedicated database and real HTTP app boot, not on test-only product routes.
- Package-local documentation should stay aligned with actual files and flows in `apps/api`.

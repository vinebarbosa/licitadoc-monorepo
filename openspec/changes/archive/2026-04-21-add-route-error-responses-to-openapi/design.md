## Context

`apps/api` already derives Swagger/OpenAPI from Zod-backed route contracts, and current route schema files declare successful responses under the `response` field. At the same time, runtime failures are already normalized in `src/plugins/errors.ts` through three broad paths: Fastify validation failures, `AppError` subclasses such as `UnauthorizedError` and `ConflictError`, and unexpected internal failures.

Because these error payloads are produced consistently at runtime but are not declared consistently in route schemas, the OpenAPI document is incomplete for consumers who need to understand failure cases. This change is cross-cutting because it touches shared HTTP schema utilities plus the route schema files across multiple modules.

## Goals / Non-Goals

**Goals:**
- Define reusable Zod-backed error response schemas that match the normalized error payloads returned by the backend.
- Make it easy for application-owned route schemas to declare relevant error responses alongside successful responses.
- Backfill the current OpenAPI-exposed route modules so Swagger can show the most important error outcomes.
- Preserve compatibility with the generated OpenAPI document and downstream client generation.

**Non-Goals:**
- Changing the runtime error handler semantics or the actual JSON payloads returned by the API.
- Documenting hidden Better Auth proxy routes under `src/modules/auth/routes.ts`.
- Forcing every route to declare every possible status code, even when a failure mode does not apply to that endpoint.
- Introducing a new external documentation dependency or a second OpenAPI source of truth.

## Decisions

### Decision: Add shared HTTP error schemas in the existing `src/shared/http/` area
The most stable source for documented error payloads is the current normalized error handler. A shared HTTP utility should expose Zod-backed schemas for the standard error envelopes rather than requiring each module schema file to redefine them independently.

Alternatives considered:
- Handwrite error response schemas inside each module schema file.
  Rejected because it would duplicate shapes and drift quickly.
- Infer error responses only from the error handler plugin.
  Rejected because OpenAPI generation currently depends on declared route schemas, not on runtime reply interception.

### Decision: Model status-specific reusable envelopes that align with current runtime behavior
The shared layer should capture the current categories of backend errors:

- validation failures with `error: "validation_error"`
- application errors produced from `AppError` subclasses, such as `bad_request`, `unauthorized`, `forbidden`, `not_found`, and `conflict`
- unexpected failures with `error: "internal_server_error"`

This keeps the Swagger contract faithful to the current backend behavior while still allowing routes to opt into only the statuses they actually use.

Alternatives considered:
- Use a single generic `error: string` schema for every failure response.
  Rejected because it would document the contract too loosely to be useful.

### Decision: Keep route-level declaration explicit, but reduce boilerplate with shared composition helpers or response maps
Not every route can return the same failures, so route schemas should still choose which error statuses apply. To avoid repetitive response objects, the shared HTTP layer should expose composable helpers or reusable status maps that can be merged into each route's `response` declaration.

Alternatives considered:
- Auto-attach the same set of errors to every route.
  Rejected because that would over-document endpoints and reduce trust in the contract.
- Require every route schema to handwrite each status entry.
  Rejected because it creates repetitive maintenance work.

### Decision: Backfill only the application-owned Zod OpenAPI routes
The current modules using `AppRouteSchema` and `FastifyPluginAsyncZodOpenApi` are the main targets: invites, users, organizations, departments, processes, and documents. The Better Auth proxy route remains hidden today, so it should stay outside the scope of this change.

Alternatives considered:
- Expand the change to hidden auth proxy routes.
  Rejected because those routes are not currently exposed through the same application-owned schema layer.

## Risks / Trade-offs

- [Error documentation may drift if runtime payloads change later] -> Anchor the shared schemas directly to the normalized shapes already emitted by `src/plugins/errors.ts` and the shared `AppError` subclasses.
- [Over-documenting route failures could make Swagger noisy] -> Keep route-level selection explicit and add only statuses that actually apply to the endpoint.
- [Under-documenting routes could still leave gaps] -> Backfill the current application-owned modules and review each schema file against its real policy and service behavior.
- [Richer OpenAPI responses might expose client-generation edge cases] -> Validate the exported OpenAPI document and the existing client-generation workflow after the schema updates land.

## Migration Plan

Add the shared error response schemas and composition utilities, update the current route schema files to declare relevant failure responses, regenerate or inspect the OpenAPI output, and confirm client generation still works. No runtime migration, data migration, or rollout sequencing is required because the change is contract-documentation only.

## Open Questions

No open questions at this time.

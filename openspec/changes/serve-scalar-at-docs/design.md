## Context

`apps/api` currently registers `@fastify/swagger` to build the OpenAPI document and `@fastify/swagger-ui` to render the interactive docs at `/docs`. The actual contract source is already exposed separately at `/openapi.json`, and that endpoint returns the merged application and auth document through `app.getOpenApiDocument()`.

Because the exported document is already available from a stable route, the UI layer can be swapped without changing how the contract is generated or served. The main design concern is preserving the same API coverage while replacing the current Swagger UI shell with Scalar.

## Goals / Non-Goals

**Goals:**
- Serve Scalar at `/docs` instead of Swagger UI.
- Keep `/openapi.json` as the canonical, merged OpenAPI source.
- Preserve the existing app and auth route coverage shown in the docs.
- Limit the change to documentation delivery and dependency wiring in `apps/api`.

**Non-Goals:**
- Changing route schemas or the content model of the OpenAPI document.
- Moving the OpenAPI JSON route away from `/openapi.json`.
- Reworking authentication, route registration, or non-documentation plugins.
- Introducing a separate documentation build pipeline outside Fastify.

## Decisions

### Decision: Keep `@fastify/swagger` for document generation and replace only the UI layer
The existing OpenAPI generation path is already working and feeds both exported contracts and downstream client generation. Replacing only the UI renderer minimizes risk and keeps the scope focused on the user's request.

Alternatives considered:
- Replace the entire OpenAPI generation stack together with the docs UI.
  Rejected because the request is about the documentation surface at `/docs`, not the source contract pipeline.

### Decision: Point Scalar at `/openapi.json` instead of reconstructing the merged document inside the UI registration
`/openapi.json` already returns the merged application and auth document through a single server route. Having Scalar consume that URL preserves one source of truth and avoids duplicating merge logic in two documentation surfaces.

Alternatives considered:
- Inject the merged document directly into the Scalar registration.
  Rejected because it duplicates logic the app already exposes via `getOpenApiDocument()`.

### Decision: Preserve the `/docs` route instead of introducing a new docs URL
The request explicitly targets `/docs`, and keeping the same path avoids breaking developer habits, bookmarks, or internal links. Only the rendered experience should change.

Alternatives considered:
- Expose Scalar on a new path such as `/scalar` and keep Swagger UI in place.
  Rejected because it would split the docs experience and not satisfy the request to have Scalar on `/docs`.

### Decision: Treat this as a backend plugin integration change
The current docs setup lives in `src/plugins/openapi.ts`, so the implementation should remain centralized there, alongside any package or bootstrapping changes needed for Scalar.

Alternatives considered:
- Add a separate frontend app or static docs bundle.
  Rejected because the current architecture already serves interactive API docs from Fastify, and this change does not require a new deployment surface.

## Risks / Trade-offs

- [Scalar integration has different Fastify options than Swagger UI] -> Keep the change isolated to the OpenAPI plugin and verify `/docs` and `/openapi.json` together after wiring the new package.
- [Docs could accidentally stop showing the merged auth routes] -> Make Scalar load the existing `/openapi.json` endpoint, which already reflects the merged document.
- [Dependency changes could affect local developer startup or CI] -> Add the new docs dependency in `apps/api`, remove the old UI dependency only if it is no longer used, and verify with the existing backend checks.

## Migration Plan

Update the API docs plugin to register Scalar at `/docs`, keep the OpenAPI JSON endpoint unchanged, and validate that the docs route renders successfully against the exported contract. If rollback is needed, restoring the previous Swagger UI registration in the same plugin returns the system to its prior behavior.

## Open Questions

No open questions at this time.

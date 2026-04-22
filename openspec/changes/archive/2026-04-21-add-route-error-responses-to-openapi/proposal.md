## Why

The current route schemas already document successful responses in Swagger/OpenAPI, but they do not consistently describe the error payloads that the API actually returns. That leaves backend consumers and maintainers without a clear contract for validation, auth, conflict, and unexpected failure responses even though those shapes are already normalized at runtime.

## What Changes

- Extend application-owned route contracts so Swagger/OpenAPI can show documented error responses in addition to success responses.
- Introduce shared error-response schema building blocks so route modules can declare common error payloads without duplicating the same shapes in every schema file.
- Document how route schemas should expose common error statuses such as validation, unauthorized, forbidden, conflict, not found, and internal server error when those outcomes apply to the route.
- Keep the generated OpenAPI document and downstream client generation aligned with the richer response contract.

## Capabilities

### New Capabilities

### Modified Capabilities
- `api-route-schemas`: Route contracts and the exported OpenAPI document must include declared error responses, not only successful payloads, using reusable Zod-backed schema definitions.

## Impact

- Affected code: shared HTTP schema utilities, route schema files under `apps/api/src/modules/**`, OpenAPI generation output, and tests that validate documented response contracts.
- APIs: OpenAPI/Swagger will describe error payloads more completely, but no runtime endpoint behavior is intended to change.
- Systems: backend maintainers, frontend consumers, and generated clients will gain a more accurate contract for failure cases.

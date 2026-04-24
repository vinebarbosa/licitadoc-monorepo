## Why

Even after adding readable request body examples, Scalar still shows noisy field-level schema details for some inputs, especially raw `pattern` regexes for UUID and email fields. That makes the docs feel technical and hard to scan, even when the payload example itself is already readable.

## What Changes

- Reduce the amount of regex-heavy field metadata exposed in the generated OpenAPI for application-owned schemas where the pattern does not help API consumers.
- Introduce a shared schema convention for documentation-friendly UUID, email, and similar field types so Scalar shows concise field information alongside examples.
- Backfill the affected application-owned request and response schemas that currently surface long `pattern` values in Scalar field views.
- Keep runtime validation and endpoint behavior unchanged while improving only the exported contract shape used for documentation.
- Preserve compatibility with `/openapi.json` and the existing client-generation workflow.

## Capabilities

### New Capabilities

### Modified Capabilities
- `api-route-schemas`: Application-owned Zod route contracts must support documentation-friendly field schemas so the exported OpenAPI document does not surface raw regex-heavy patterns where concise type/example information is sufficient.

## Impact

- Affected code: shared HTTP/schema utilities and application-owned route schema files in `apps/api/src/modules/**`.
- APIs: field-level OpenAPI presentation in Scalar becomes cleaner, but runtime validation behavior is not intended to change.
- Systems: backend maintainers and API consumers get more legible field documentation without breaking the exported contract or client generation.

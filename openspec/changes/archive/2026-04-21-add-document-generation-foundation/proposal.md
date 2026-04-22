## Why

The core product goal is to help prefeitura organizations generate administrative and legal procurement documents such as DFD, ETP, TR, and minuta. The API already models organizations, processes, and documents, but it still lacks the generation workflow and provider abstraction needed to let AI draft those documents without hard-wiring the product to a single vendor.

## What Changes

- Add the backend foundation for AI-assisted document generation tied to `organizations` and `processes`.
- Introduce a provider-agnostic generation contract so the system can start with an OpenAI-backed adapter without leaking vendor-specific naming or assumptions into the domain model.
- Add draft-generation flows for `dfd`, `etp`, `tr`, and `minuta`, using organization, process, and requester context as generation input.
- Persist generated draft content, generation status, provider metadata needed for auditing/troubleshooting, and the relation between each generated draft and its parent process.
- Expose API endpoints and contracts to request generation, inspect generation state, and read generated document drafts.
- Keep final legal approval, rich document editing UX, PDF or DOCX export, and advanced multi-provider routing out of scope for this foundation.

## Capabilities

### New Capabilities
- `document-generation`: Covers requesting, tracking, and reading generated DFD, ETP, TR, and minuta drafts for a prefeitura organization and process.
- `generation-provider`: Covers the provider-agnostic contract that executes text generation, normalizes outputs/errors, and allows OpenAI to be the first adapter without coupling the rest of the system to that vendor.

### Modified Capabilities

## Impact

- Affected code: `apps/api/src/modules/documents`, new shared generation/provider services, database schema and migrations for generated document data, route registration, OpenAPI output, and `packages/api-client`.
- APIs: New document-generation endpoints plus possible expansion of document read contracts to expose type, draft content, and generation status.
- Systems: External LLM integration through a generic provider layer, provider credentials/configuration, and generation observability/error handling.
- Data model: `documents` will need to represent generated procurement document drafts and their lifecycle, potentially alongside provider execution metadata or a related generation-run record.

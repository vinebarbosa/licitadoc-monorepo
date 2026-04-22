## Context

The current API already has `organizations`, `departments`, `processes`, and a placeholder `documents` module, but document behavior is still minimal and does not represent the core Licitadoc workflow. The product goal is to let prefeitura organizations generate procurement documents such as DFD, ETP, TR, and minuta from stored organizational and process context.

This change is cross-cutting because it affects the document domain, persistence, API contracts, runtime configuration, and a new external dependency for text generation. It also needs one architectural guardrail from the start: OpenAI can be the first adapter, but the codebase should speak in generic generation-provider terms so the backend can swap vendors later without renaming the domain.

## Goals / Non-Goals

**Goals:**
- Turn the `documents` domain into the foundation for generated procurement drafts tied to `organizations` and `processes`.
- Introduce a provider-agnostic text-generation interface and runtime configuration that can start with an OpenAI-backed adapter.
- Persist both the generated draft and the execution lifecycle needed for status reads, troubleshooting, and future retries.
- Keep authorization aligned with the existing organization-scoped admin API rules.
- Keep the public API compatible with a future move to asynchronous/background execution even if the first implementation runs inline.

**Non-Goals:**
- Building the frontend document editor or review workflow.
- Guaranteeing legal correctness or automatic approval of generated content.
- Exporting PDF or DOCX files.
- Implementing advanced provider routing, provider ranking, or failover across multiple vendors.
- Introducing queue infrastructure in this first foundation change.

## Decisions

### Decision: Keep the public behavior inside the `documents` module and add a shared generation-provider layer
Generated DFD, ETP, TR, and minuta artifacts are still documents in the product domain, so the HTTP routes and business workflows should live under `src/modules/documents`. The vendor integration itself is cross-cutting, so it should live in a shared layer plus a Fastify plugin that resolves the configured provider and exposes a generic generation client to route handlers and services.

Alternatives considered:
- Create a separate `ai` or `openai` module for the whole feature.
  Rejected because it would make the external dependency look like the domain owner instead of `documents`.
- Call OpenAI directly from the document services.
  Rejected because it would spread vendor assumptions through the module and make later replacement harder.

### Decision: Evolve `documents` into the canonical draft record and store provider executions in a separate `document_generation_runs` table
The system needs one business record that represents the generated document itself and another record that represents generation attempts. The `documents` table should become the canonical document draft entity, storing fields such as `type`, lifecycle `status`, and generated draft content. A new `document_generation_runs` table should capture provider-facing execution data such as `providerKey`, `model`, normalized request metadata, normalized error details, and timestamps.

This separation keeps the document readable and editable without coupling every document read to provider diagnostics, while still preserving the audit trail needed for failures and future retries.

Alternatives considered:
- Store all provider metadata directly on the `documents` row.
  Rejected because it mixes business state with execution history and makes retries overwrite useful diagnostics.
- Keep generation results only in an ephemeral service response.
  Rejected because it would lose failure history and make status reads impossible.

### Decision: Use generic text-generation naming in configuration and code
The system should expose generic names such as `text generation provider`, `providerKey`, and `model`, with runtime configuration shaped around generic keys like `TEXT_GENERATION_PROVIDER`, `TEXT_GENERATION_MODEL`, and `TEXT_GENERATION_API_KEY`. Provider-specific adapters can still translate those settings internally, but the rest of the codebase should not need `openai` in service, module, or route names.

Alternatives considered:
- Name the integration around `openai` because it is the first vendor.
  Rejected because the requester explicitly wants a provider-neutral foundation.
- Hide the provider completely and store no provider identity.
  Rejected because operational debugging still needs to know which adapter and model produced a draft.

### Decision: Build generation requests from typed procurement context instead of exposing a raw prompt passthrough endpoint
The API should accept a document-generation request in domain language: target `processId`, `documentType`, and optional requester instructions. The service layer should then assemble the provider prompt from stored organization data, stored process data, and the requested document type. This keeps the product anchored in procurement workflows and makes later prompt/template refinement possible without changing the public API.

Alternatives considered:
- Expose a free-form prompt endpoint and let clients send arbitrary prompts.
  Rejected because it would leak prompting concerns into the API contract and weaken consistency across generated documents.
- Generate documents only from stored data with no user-supplied instructions.
  Rejected because operators still need to pass contextual notes and constraints for a given draft.

### Decision: Execute the first version inline but persist queue-ready lifecycle states
The initial implementation should create the document draft and generation-run records, transition status to `generating`, call the provider inline, and then finalize the document as `completed` or `failed`. This avoids introducing background workers immediately while still producing the status model that a future queue can reuse without breaking the contract.

Alternatives considered:
- Require a job queue from day one.
  Rejected because it would add substantial infrastructure before the core provider/document contract is proven.
- Return only synchronous success or failure without persisted statuses.
  Rejected because it would make retries, troubleshooting, and future asynchronous execution harder.

### Decision: Store generated draft content as canonical text and keep file export concerns separate
The generated draft should be persisted as canonical text content that the API can return directly. This is the simplest representation for DFD, ETP, TR, and minuta drafts and keeps the system ready for later review/edit flows. File-oriented concerns such as `storageKey` should become optional support for future export or upload flows rather than the primary representation of generated content.

Alternatives considered:
- Persist only a file/blob reference.
  Rejected because generated drafts need to be readable and editable without a separate export step.
- Persist a deeply structured JSON section tree from the start.
  Rejected because it increases implementation complexity before the section model is validated against real document-generation usage.

### Decision: Scope generation and reads with the same organization visibility model already used by `processes`
Document-generation requests should resolve the parent process first and then enforce the same visibility rules already present in the admin API: `admin` can operate across organizations, while `organization_owner` and `member` stay inside their own organization. This keeps documents anchored to their parent process instead of inventing another scope model.

Alternatives considered:
- Let document access depend only on document ownership checks without resolving process scope.
  Rejected because the process already carries the authoritative organization relationship for procurement work.

## Risks / Trade-offs

- [Changing the `documents` table from file-oriented storage to generated-draft storage may affect any future upload flow] -> Keep the migration additive where possible, make file-reference fields optional instead of removing them outright, and reserve upload/export behavior for a later change.
- [Inline provider calls can increase request latency] -> Persist lifecycle states now so the implementation can move behind a queue later without contract churn.
- [Generated legal or administrative text may contain inaccuracies] -> Keep the foundation explicitly draft-oriented and avoid implying automatic approval.
- [Provider-neutral naming can hide vendor-specific limits] -> Normalize the common contract, but preserve `providerKey`, `model`, and normalized error details in generation-run records for observability.
- [Prompt quality may drift if organization or process data is sparse] -> Build the request from typed stored context and allow optional operator instructions to fill gaps.

## Migration Plan

Add the new document-generation schema in an additive way where possible: extend `documents` to support generated draft fields and create `document_generation_runs` for execution history. Introduce the generic text-generation configuration in the env plugin and register a provider plugin that decorates the Fastify app with the active adapter.

After the schema and shared provider layer are in place, implement the `documents` routes and services for generation request, status/detail read, and list behavior. Then regenerate OpenAPI and the generated API client, add unit and E2E coverage, and validate the affected packages.

If rollback is needed before the feature is used in production, the safest path is to stop routing traffic to the new generation endpoints and leave the additive schema in place. This avoids destructive rollback of persisted document drafts or generation-run history.

## Open Questions

No blocking open questions at this time. This design assumes the first foundation exposes generated drafts as text and uses inline execution with persisted statuses, while leaving richer review UX and background execution for future changes.

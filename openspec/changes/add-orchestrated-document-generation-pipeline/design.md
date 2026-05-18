## Context

The current backend resolves a document recipe, assembles a provider prompt from process/source metadata, calls the generation provider, sanitizes selected outputs, and stores the draft. Recipe assets for DFD, ETP, TR, and Minuta carry a large share of semantic work, including classification, value handling, proportionality, and anti-hallucination rules. This makes behavior hard to test and lets document-type boundaries blur.

The API contract is derived from Zod route schemas and exported to `apps/api/openapi/openapi.json`; that file is not a handwritten source artifact. The public create-document request should remain compatible, with any pipeline/debug fields added through Zod schemas and exported OpenAPI metadata.

The existing `sd-document-intelligence` skill defines the desired semantic workflow: extract literal SD facts, classify the procurement object before inferring, compress the object semantically, derive administrative context, plan documents dynamically, and preserve pending issues instead of inventing data.

## Goals / Non-Goals

**Goals:**

- Split generation into explicit internal stages: extractor, context enrichment, document planning, writer, reviewer, and bounded final rewrite.
- Define a canonical `EnrichedContextPackage` with typed/Zod schemas and provider-ready serialization.
- Preserve the existing public document-generation API where possible.
- Treat `0`, `0,00`, `0.00`, and `R$ 0,00` as missing estimate/price evidence everywhere in the pipeline.
- Make DFD, ETP, TR, and Minuta recipes smaller and role-specific.
- Persist or expose debug trace data only when explicitly requested.
- Add unit and integration tests that exercise classification, zero-value normalization, role boundaries, review, and rewrite behavior.

**Non-Goals:**

- Replace the text-generation provider abstraction.
- Add a new database schema unless existing document metadata cannot carry the trace safely.
- Provide legal validation or definitive procurement modality selection.
- Make users submit raw provider prompts or manually select pipeline stages.
- Build frontend UI for debug traces in this change.

## Decisions

### Decision: Keep the current public generation endpoint and orchestrate internally

Document creation should continue to accept the existing document type, process target, and optional instructions. The handler delegates to a pipeline service that returns final Markdown plus optional debug trace. New request fields are additive, such as `debug?: boolean`, and response fields remain compatible unless debug is requested.

Alternative considered: create a new `/documents/pipeline` endpoint. Rejected because callers already model document generation as document creation, and a new public surface would create avoidable client churn.

### Decision: Represent pipeline state with typed Zod schemas

Create schemas and TypeScript types for `ExtractedSdFacts`, `EnrichedContextPackage`, `DocumentPlan`, `DocumentReviewResult`, and `DocumentGenerationPipelineDebug`. Use those schemas both for internal validation and, where public, route/OpenAPI response documentation.

Alternative considered: keep pipeline payloads as loose JSON passed between prompt builders. Rejected because the main failure mode is semantic drift and untestable prompt-only behavior.

### Decision: Extractor performs no inference

The extractor normalizes only literal evidence from stored process data, source metadata, and structured items. It copies object, justification, administrative fields, item rows, quantities, units, values, process data, responsible data, classification labels, and budget fields. It normalizes zero-like monetary values to `null` and emits `hasValidEstimatedValue: false`.

Alternative considered: let the extractor classify obvious objects. Rejected because the enrichment skill explicitly requires classification before inference, not during factual extraction.

### Decision: Context enrichment is deterministic-first with provider-assisted fallback

Implement a deterministic enrichment module for common classifications and risk/plan hints, aligned with the skill rubric. Provider-assisted enrichment can be introduced through the existing provider contract when needed, but must return JSON validated against the canonical schema and must not invent missing facts.

Alternative considered: make every enrichment step a model call. Rejected for cost, latency, testability, and predictable acceptance coverage.

### Decision: Plans are document-specific and derived from the enriched context

The planning stage creates a `DocumentPlan` for the requested type. DFD stays short and introductory; ETP becomes analytical and proportional; TR focuses on execution, receiving, obligations, fiscalization, payment, and specifications; Minuta focuses on contractual placeholders and clauses without viability analysis.

Alternative considered: keep all planning instructions in recipe files. Rejected because duplicated planning language is exactly what causes recipes to assume too many responsibilities.

### Decision: Writer remains the only Markdown authoring stage

The writer receives enriched context, document plan, document-specific instructions, template, and optional operator instructions. It produces Markdown only. Prompt assembly includes explicit context JSON/text blocks so the provider can trace each statement back to facts, inference, pending issue, risk, or plan guidance.

Alternative considered: generate individual sections in separate calls. Rejected for this change because it increases orchestration complexity before the pipeline has a stable contract.

### Decision: Reviewer returns structured JSON and rewrite is bounded

The reviewer validates the first draft against document role, context use, zero-value handling, item coverage, repetition, generic wording, proportionality, signature/placeholders, alternatives, and risks. If status is `needs_revision`, the rewriter applies targeted changes using the review result and original draft. The loop stops after two rewrite cycles or the first approved review.

Alternative considered: ask the writer to self-review inside the same prompt. Rejected because a separate validated review object is easier to test, log, and debug.

### Decision: Debug traces are opt-in and sanitized

The pipeline produces an internal trace containing extracted facts, enriched context, classification, plan, first draft, reviews, rewrite attempts, and final draft. Default responses do not expose it. When debug is requested by an authorized caller, response schemas can expose trace data without leaking raw provider internals beyond generation artifacts.

Alternative considered: always persist full traces. Rejected because traces can be large and may include sensitive procurement context.

## Risks / Trade-offs

- [Risk] Multiple provider calls can increase latency and cost. -> Mitigation: keep extractor/enrichment/planning deterministic where practical and make review/rewrite bounded.
- [Risk] Deterministic classification may miss edge cases. -> Mitigation: use confidence scores, pending issues, and tests for known acceptance profiles; allow provider-assisted enrichment behind validated schemas later.
- [Risk] Debug traces may expose sensitive content. -> Mitigation: make debug opt-in, organization-scoped, and avoid returning raw provider error payloads.
- [Risk] Recipe simplification can remove useful document-specific safeguards. -> Mitigation: move shared safeguards into pipeline/shared instructions and keep role-specific anti-alucination rules in each recipe.
- [Risk] Integration tests that call the provider may become slow or flaky. -> Mitigation: use stubbed providers and assert pipeline inputs/outputs rather than external model behavior.

## Migration Plan

1. Add pipeline schemas, types, and stage modules beside the existing documents module.
2. Wire the current create-document flow through the pipeline while keeping existing request fields valid.
3. Refactor recipe assets after pipeline prompt assembly can supply enriched context and plans.
4. Add/adjust route schemas and regenerate OpenAPI/client artifacts if public schemas change.
5. Add focused unit and integration tests with stubbed providers for RH advisory, Mothers Day kits, artistic presentation, simple acquisition, and zero-value cases.
6. Roll back by switching create-document back to the previous prompt assembly path and leaving unused pipeline modules inert.

## Open Questions

- Should debug trace data be stored on generated document metadata, returned only during synchronous creation, or both?
- Should provider-assisted context enrichment ship in this change, or should the first implementation keep enrichment deterministic and reserve the provider for writer/reviewer/rewriter stages?

## 1. Current Architecture and Contract Mapping

- [x] 1.1 Inspect current document-generation route schemas, create service, worker, shared context builder, recipe resolver, provider contract, and OpenAPI export path.
- [x] 1.2 Identify the current public create/list/read response shapes and decide which pipeline/debug fields are additive.
- [x] 1.3 Inspect existing document recipe tests and document module tests for reusable fixtures and expectations.

## 2. Pipeline Schemas and Types

- [x] 2.1 Add Zod schemas and derived TypeScript types for extracted facts, normalized items, procurement classification, enriched context package, document plan, review result, rewrite attempts, and pipeline debug trace.
- [x] 2.2 Add utilities for zero-like monetary normalization so `0`, `0,00`, `0.00`, and `R$ 0,00` become missing estimate evidence.
- [x] 2.3 Export public DTO schemas only where route responses can expose debug trace data.

## 3. Extractor and Context Enrichment

- [x] 3.1 Implement an extractor that reads stored process data, organization, department, responsible data, source metadata, structured items, and budget fields without inference.
- [x] 3.2 Implement classification and semantic compression aligned with the local `sd-document-intelligence` skill and inference rubric.
- [x] 3.3 Implement administrative inferences, pending issues, risks, alternatives, tone guidance, and generation hints after classification.
- [x] 3.4 Add unit tests for zero-value normalization, extractor no-inference behavior, and classification profiles for RH advisory, Mothers Day kits, artistic presentation, and simple acquisition.

## 4. Document Planning

- [x] 4.1 Implement the document planning agent for DFD, ETP, TR, and Minuta using enriched classification and complexity.
- [x] 4.2 Add tests proving DFD plans remain concise, ETP plans are analytical and proportional, TR plans are operational, and Minuta plans are contractual.

## 5. Writer, Reviewer, and Rewriter

- [x] 5.1 Refactor writer prompt assembly to receive enriched context, document plan, operator instructions, document instructions, and template.
- [x] 5.2 Implement structured review parsing/validation with `DocumentReviewResult`.
- [x] 5.3 Implement targeted final rewrite using review issues and cap automatic revisions at two cycles.
- [x] 5.4 Add provider-stub tests for approved first drafts, needs-revision drafts, and two-cycle rewrite cutoff.

## 6. Route Integration and Debug Trace

- [x] 6.1 Wire the current create-document flow through the pipeline while preserving existing public request compatibility.
- [x] 6.2 Add optional debug request/response handling for extracted facts, enriched context, plan, first draft, review, rewrite attempts, and final draft.
- [x] 6.3 Ensure authorization scoping for debug output matches existing document/process visibility rules.

## 7. Recipe Refactor

- [x] 7.1 Simplify DFD instructions to document role, limits, structure, tone, anti-hallucination, zero-value, signature, and boundary rules.
- [x] 7.2 Simplify ETP instructions to analytical role, proportionality, context use, anti-hallucination, zero-value, signature, and boundary rules.
- [x] 7.3 Simplify TR instructions to operational role, execution/receiving/obligations/fiscalization/payment focus, anti-hallucination, zero-value, signature, and boundary rules.
- [x] 7.4 Simplify Minuta instructions to contractual role, placeholders, fixed clauses, signatures, anti-hallucination, zero-value, and boundary rules.
- [x] 7.5 Move shared heavy semantic guidance out of per-document instruction assets into pipeline/shared context where needed.

## 8. Integration Coverage and Contract Generation

- [x] 8.1 Add integration tests with stubbed providers for RH advisory ETP, Mothers Day kits, artistic presentation, and simple acquisition.
- [x] 8.2 Add tests proving final drafts do not confuse DFD/ETP/TR/Minuta roles and do not treat zero values as valid prices.
- [x] 8.3 Regenerate OpenAPI and generated API client artifacts if route schemas changed.
- [x] 8.4 Run focused document-generation tests, API typecheck, OpenSpec validation, and any available contract-generation checks.

## 9. Documentation

- [x] 9.1 Add short backend documentation explaining the pipeline flow, stage responsibilities, debug trace behavior, and recipe responsibility split.
- [x] 9.2 Update implementation notes or module comments only where they help future maintainers understand the stage boundaries.

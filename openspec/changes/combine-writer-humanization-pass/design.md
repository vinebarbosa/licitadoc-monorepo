## Context

The SD-backed generation pipeline currently produces a draft through a `writer` provider call, then sends that draft through a separate `humanization` provider call. After that, a local review can approve the draft or request one or more `rewrite` calls. When structured output is enabled, the accepted text is projected into validated JSON/AST through a final `structured_output` provider call.

The latest measured DFD used `gpt-4.1-mini` and completed without rewrite, but still paid for three provider calls: `writer`, `humanization`, and `structured_output`. The humanization call was the largest avoidable cost center in that successful run. This change tests whether the writer prompt can produce the final institutional tone directly while preserving the existing quality gate and structured-output projection.

## Goals / Non-Goals

**Goals:**

- Add a configurable combined final-writer path that replaces separate `writer` and `humanization` calls for SD-backed document generation.
- Preserve the local review loop and existing rewrite behavior after the combined draft.
- Preserve the current structured-output projection as a separate call, so this experiment measures only the writer/humanization merge.
- Preserve fallback to the current two-step writer plus humanization path while the combined path is being evaluated.
- Emit clear pipeline metadata for cost, token, stage, review, rewrite, and structured-output comparison.

**Non-Goals:**

- Do not generate the JSON/AST directly in the first provider call.
- Do not remove structured-output validation, repair, or legacy document read fallbacks.
- Do not change public document create/read APIs.
- Do not remove the existing humanization prompt until the combined path has been tested against real documents.

## Decisions

### Decision: Gate the combined path behind configuration

The combined writer/humanization path should be enabled through backend configuration rather than replacing the current behavior unconditionally. This keeps rollback simple and allows the same process/document fixtures to be generated through both paths during evaluation.

Alternative considered: replace the current path outright. Rejected because the existing split path is a known-good baseline, and the purpose of this change is to test cost reduction without silently weakening document quality.

### Decision: Fold humanization guidance into the writer prompt

The first provider call should become responsible for both document completeness and final institutional tone. Prompt assembly should include the existing writer context, document plan, style selection, and the useful parts of the humanization guidance: avoid metalinguagem, avoid unsupported facts, keep a dry/institutional tone, and produce a final document rather than a draft awaiting stylistic cleanup.

Alternative considered: keep two prompts but concatenate them mechanically. Rejected because the model would receive contradictory phase language such as "first draft" plus "humanization pass"; the combined path should be explicit that the output is the final reviewed candidate.

### Decision: Keep local review and rewrite unchanged

After the combined writer result is sanitized, the existing local review should run exactly as it does today. If it approves, the pipeline continues to structured output. If it rejects, the existing rewrite prompt can still perform targeted repair before another review cycle.

Alternative considered: remove review to maximize savings. Rejected because review is local and free; it is the main guardrail protecting quality when the prompt shape changes.

### Decision: Keep structured output as the final projection call

Structured output should remain a separate final provider call for this experiment. This isolates one variable: whether `writer` and `humanization` can be merged. Direct structured writing can be tested later after this cheaper intermediate path is measured.

Alternative considered: merge writer, humanization, and structured output into one call. Rejected for this change because it changes both cost and output contract at once, making quality regressions harder to diagnose.

### Decision: Represent the combined call as a distinct pipeline stage

Generation metadata should record the combined provider call with a stable stage name such as `final_writer` or `writer_final`, instead of pretending it was the old `writer` stage. This allows cost comparisons to distinguish the baseline `writer + humanization` path from the new combined path.

Alternative considered: reuse the `writer` stage name. Rejected because it would hide the experiment in analytics and make before/after comparisons less trustworthy.

## Risks / Trade-offs

- [Risk] The combined prompt may produce a valid but less polished document than the two-step path. -> Mitigation: keep review/rewrite, keep the old path behind config, and compare generated DFDs before making it default.
- [Risk] The combined prompt may grow enough that the writer call becomes more expensive. -> Mitigation: measure total pipeline cost; success requires total provider cost to drop, not just call count.
- [Risk] Stage-name changes may break tests or dashboards that expect `writer` and `humanization`. -> Mitigation: update tests and metadata assertions to accept the configured path explicitly.
- [Risk] Humanization-specific behavior may be lost if guidance is copied incompletely. -> Mitigation: centralize shared final-style guidance so the split and combined paths can reuse the same rules.

## Migration Plan

1. Add backend configuration for the combined writer/humanization path, defaulting to the existing split behavior unless explicitly enabled.
2. Introduce combined prompt assembly that reuses writer context and final-style/humanization rules.
3. Update pipeline execution to choose either `writer` + `humanization` or the new combined final-writer call.
4. Keep local review, rewrite, structured-output validation, persistence, and response metadata behavior intact.
5. Add focused tests for both configured paths.
6. Roll back by disabling the combined-path configuration; generated documents and public APIs remain compatible.

## Open Questions

- What exact config name should be used for the experiment flag?
- Should the combined stage be named `final_writer` or `writer_final` in persisted metadata?
- What minimum acceptance bar should make the combined path the default: lower cost only, or lower cost plus no observed quality regression across DFD/ETP/TR/Minuta samples?

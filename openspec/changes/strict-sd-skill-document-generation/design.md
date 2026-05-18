## Context

The Codex `sd-document-intelligence` skill has become the highest-quality expression of how LicitaDoc should interpret Solicitações de Despesa before producing DFD, ETP, TR, and Minuta drafts. The backend already has an orchestrated generation pipeline with extraction, enrichment, planning, writing, humanization, review, and rewrite concepts, but the system flow can still drift from the skill's stricter rules and stage responsibilities.

The change should make the skill contract authoritative for SD-backed document generation. In practice, the deployed API cannot depend on an ad hoc Codex session reading a local skill file at generation time, so the implementation needs a repository-managed runtime contract that is derived from the skill and verified against it.

## Goals / Non-Goals

**Goals:**

- Use the `sd-document-intelligence` skill as the strict behavioral contract for SD-backed document generation.
- Preserve the skill's stage order: factual extraction before enrichment, semantic classification before inference, document planning before writing, review before final rewrite.
- Ensure DFD, ETP, TR, and Minuta writers receive the same enriched context and planning discipline that the Codex skill uses.
- Prevent recipes/templates from reintroducing classification, inference, or generic safety behavior outside the skill contract.
- Add drift detection between the Codex skill source and the runtime contract used by the API.
- Preserve public API compatibility for existing document generation calls.

**Non-Goals:**

- Replacing the existing OpenAI/text generation provider.
- Rewriting SD PDF intake from scratch.
- Turning the Codex skill into a user-visible prompt or exposing internal pipeline instructions to end users.
- Generating legal conclusions, price research, budget availability, supplier data, or missing operational details not present in the SD or process context.
- Removing the existing humanization pass; it remains subordinate to the skill contract.

## Decisions

### Decision 1: Introduce a runtime skill contract asset

Create a runtime-loadable contract asset for `sd-document-intelligence`, derived from `.codex/skills/sd-document-intelligence/SKILL.md`. The backend pipeline will load this contract when generating SD-backed documents and embed its rules into the relevant internal prompts/stage builders.

Alternative considered: directly read `.codex/skills/sd-document-intelligence/SKILL.md` at runtime. This is attractive in local development but brittle for deployments and package boundaries. The better approach is to keep a packaged runtime mirror and verify that it matches the Codex skill.

### Decision 2: Add drift detection instead of trusting duplicated prompt text

Store contract metadata with the runtime asset, including source path, source hash, contract version, and last synchronized skill hash. Add tests that compare the runtime contract to the Codex skill source or to a deterministic normalized digest. If the skill changes, tests must fail until the runtime contract is synchronized.

Alternative considered: manually copy skill text into prompts and rely on review. That repeats the problem: the system can silently drift from the skill.

### Decision 3: Make the skill-aligned context package the required handoff

The pipeline will produce or load a canonical enriched context package before document writing. Writers, reviewers, humanization, and final rewrite will consume the package and document plan; they will not redo classification or invent missing data.

Alternative considered: keep document-specific prompts independently responsible for interpreting SD context. That has already produced lower-quality and less predictable output than the skill.

### Decision 4: Fail closed for SD-backed generation when the skill contract is unavailable

If the runtime skill contract cannot be loaded or parsed for an SD-backed process, generation should fail with an internal generation error instead of falling back to a generic prompt. This preserves the user's requirement that the system use the skill strictly.

Alternative considered: fallback to the current system flow. That would preserve availability but violate the core goal and allow quality regressions.

### Decision 5: Keep templates render-only and recipes writer-only

The existing cleanup that moved heavy intelligence out of templates remains valid. Under this change, recipes describe document role and writing boundaries; all SD intelligence remains in the skill contract and pipeline package.

Alternative considered: insert skill rules into every document instruction file. That would make drift and duplication worse.

## Risks / Trade-offs

- Skill contract drift -> Mitigation: contract hash tests and a synchronization task that must be run whenever the Codex skill changes.
- Longer prompts and higher token cost -> Mitigation: compile the skill into structured stage prompts and include only the relevant contract sections for each stage.
- Stricter fail-closed behavior can surface errors earlier -> Mitigation: explicit error codes, debug metadata, and tests for unavailable contract handling.
- Existing generated drafts may differ in tone and length -> Mitigation: regression tests with representative SDs for RH advisory, kits/distribution, artistic presentation, simple acquisition, DFD/ETP/TR/Minuta role separation, and zero-value handling.
- Ambiguity around "strictly use the skill" in deployed environments -> Mitigation: document that the runtime contract is the packaged form of the Codex skill, with drift checks proving equivalence.

## Migration Plan

1. Add the runtime skill contract asset and metadata.
2. Add loader/parser utilities and hash/drift tests.
3. Wire SD-backed document generation through the skill contract before writer prompt assembly.
4. Update debug metadata to include contract identity, version, and stage outputs only when debug is requested.
5. Update recipe tests to prove recipes/templates remain subordinate to the skill contract.
6. Run focused document generation tests, typecheck, OpenAPI generation only if schemas change, and OpenSpec validation.

Rollback is straightforward: revert the contract loader and pipeline wiring. Public generation API compatibility should remain unchanged.

## Open Questions

- Should runtime synchronization copy the entire skill Markdown verbatim, or compile it into stage-specific sections while storing the full source hash?
- Should the API expose the skill contract version in normal metadata, or only in debug metadata?

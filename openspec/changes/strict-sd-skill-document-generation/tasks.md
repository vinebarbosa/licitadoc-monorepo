## 1. Contract Source and Drift Controls

- [x] 1.1 Inspect `.codex/skills/sd-document-intelligence/SKILL.md`, current document pipeline, recipe loader, prompt assembly, debug metadata, and tests to identify all places where the system can diverge from the skill.
- [x] 1.2 Add a runtime-loadable `sd-document-intelligence` contract asset derived from the Codex skill, including contract version, source path, source digest, and synchronized contract digest.
- [x] 1.3 Implement a contract loader/parser that exposes stage rules, stage order, classification rules, zero-value rule, document planning rules, and document role boundaries to the pipeline.
- [x] 1.4 Add drift detection tests that fail when the Codex skill source and runtime contract are out of sync.
- [x] 1.5 Add a fail-closed error path for SD-backed generation when the runtime skill contract cannot be loaded, parsed, or validated.

## 2. Skill-Aligned Pipeline Enforcement

- [x] 2.1 Wire SD-backed document generation so factual extraction runs before enrichment and no inference is produced before semantic classification.
- [x] 2.2 Ensure the enriched context package includes facts, semantic object, classification, inferences, pending issues, risks, alternatives, recommended tone, document plans, and generation hints in separate fields.
- [x] 2.3 Pass the runtime skill contract, enriched context package, document plan, writer style, shared writer rules, recipe instructions, template, and operator instructions into Writer prompt assembly.
- [x] 2.4 Ensure Humanization, Reviewer, and Final Rewrite consume the skill contract and do not reclassify or invent missing data.
- [x] 2.5 Extend debug metadata to include skill contract identity and stage outputs only when debug mode is requested.
- [x] 2.6 Preserve the public generation request shape and avoid requiring raw prompts or new caller-supplied skill inputs.

## 3. Recipe Responsibility Cleanup

- [x] 3.1 Audit DFD, ETP, TR, and Minuta instructions/templates for classification, inference, context-package, zero-value, or anti-alucination rules that now belong exclusively to the skill contract.
- [x] 3.2 Move any remaining duplicated SD intelligence from recipe assets into the runtime skill contract or shared writer layer as appropriate.
- [x] 3.3 Keep templates render-only with headings, placeholders, fixed clauses, signature slots, and layout.
- [x] 3.4 Keep document-specific instructions focused on document identity, role boundaries, tone, depth, emphasis, and avoid lists.
- [x] 3.5 Add recipe tests proving templates and document-specific instructions do not regain skill-owned intelligence.

## 4. Acceptance Case Coverage

- [x] 4.1 Add or update tests for a recurring RH advisory ETP to prove technical, recurring, operationally robust treatment.
- [x] 4.2 Add or update tests for a Dia das Mães kit/material distribution SD to prove social/institutional, point-in-time acquisition treatment and distribution/receiving controls.
- [x] 4.3 Add or update tests for an artistic presentation SD to prove cultural/event classification, date sensitivity, execution evidence, and acceptance controls.
- [x] 4.4 Add or update tests for a simple acquisition to prove the final document remains proportional and not artificially long.
- [x] 4.5 Add tests proving zero values are never treated as valid prices, estimates, totals, economicity evidence, or contract values.
- [x] 4.6 Add tests proving DFD does not become ETP, ETP does not become TR, TR does not become Minuta, and Minuta does not become technical study.

## 5. Review and Rewrite Strictness

- [x] 5.1 Extend reviewer checks so drafts are evaluated against the runtime skill contract, enriched context package, document plan, and requested document type.
- [x] 5.2 Ensure reviewer issues flag missing context usage, hallucinated facts, invalid zero-value handling, wrong document role, generic text, excessive repetition, meta-language, and excessive defensiveness.
- [x] 5.3 Ensure final rewrite applies review issues directionally without restarting from scratch and without exceeding the existing rewrite-cycle cap.
- [x] 5.4 Add tests proving the reviewer evaluates the humanized draft and the rewriter corrects skill-contract violations.

## 6. Documentation and Validation

- [x] 6.1 Update document-generation README with the strict skill contract flow, runtime contract asset, drift detection, fail-closed behavior, debug metadata, and recipe responsibility boundaries.
- [x] 6.2 Update OpenAPI schemas only if debug metadata or public DTOs change; preserve public generation request compatibility where possible.
- [x] 6.3 Regenerate generated API client artifacts only if OpenAPI output changes.
- [x] 6.4 Run focused document-generation tests and recipe tests.
- [x] 6.5 Run API typecheck or the narrowest available type validation.
- [x] 6.6 Run OpenSpec validation for `strict-sd-skill-document-generation`.

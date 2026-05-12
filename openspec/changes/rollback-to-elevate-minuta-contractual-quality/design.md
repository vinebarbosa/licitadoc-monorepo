## Context

The repository currently has many OpenSpec changes represented as local working-tree edits rather than as separate Git commits. The target state is not the last Git commit; it is the local state immediately after `elevate-minuta-contractual-quality`, before the ten newer changes that introduced multi-item semantic consolidation, structured SD item arrays, prompt-facing item evidence, and frontend SD item preview behavior.

This makes the rollback a selective restoration problem. A raw `git reset` would discard too much, while keeping the current working tree would preserve behavior the user explicitly wants removed. The implementation must therefore use the OpenSpec change history as the source of intent, identify files and behavior introduced after the checkpoint, and restore only those surfaces.

## Goals / Non-Goals

**Goals:**

- Preserve all behavior from `elevate-minuta-contractual-quality`, especially the improved Minuta recipe, fixed clause stability, richer semi-fixed clauses, and type-aware conditional contractual modules.
- Remove behavior introduced by the ten later changes:
  - `consolidate-multi-item-contracting-object`
  - `preserve-multi-item-object-fidelity`
  - `right-size-dfd-multi-item-detailing`
  - `naturalize-dfd-multi-item-wording`
  - `prevent-dfd-heuristic-language-leakage`
  - `add-object-semantic-summary`
  - `add-scalable-expense-request-item-structure`
  - `preserve-full-sd-item-evidence-in-prompts`
  - `add-expense-request-items-to-process-form`
  - `relax-multi-item-semantic-generation`
- Restore SD intake, PDF parsing, document prompt assembly, recipe assets, frontend process creation, and tests to the checkpoint behavior.
- Keep the rollback auditable by creating a backup/snapshot before destructive edits and validating the final behavior with focused tests.

**Non-Goals:**

- Do not roll back older changes that predate `elevate-minuta-contractual-quality`.
- Do not redesign document generation or introduce a replacement semantic architecture.
- Do not introduce new database behavior, API contracts, provider configuration, authentication changes, or organization/departments changes.
- Do not preserve structured SD item-array behavior, object semantic summary behavior, or frontend SD item preview behavior from post-checkpoint changes.
- Do not archive or delete historical OpenSpec change directories unless that is explicitly part of making the working tree match the checkpoint and is backed by a pre-rollback snapshot.

## Decisions

### Decision: Treat `elevate-minuta-contractual-quality` as the semantic checkpoint

The rollback should use the eleventh latest change as the intended product boundary. The implementation should preserve the Minuta artifacts and tests implied by that change, then remove the ten later changes by behavior surface.

Alternatives considered:

- Reset to the last Git commit. Rejected because the last commit predates the checkpoint and would lose desired work.
- Keep current code and only disable new behavior behind flags. Rejected because the request is to return the code exactly to the checkpoint, not to keep dormant later code.

### Decision: Start with a local backup before edits

Before applying rollback edits, create a local patch or branch/snapshot of the current working tree. The current state has no commit-level checkpoints and contains many untracked files, so a backup is necessary to recover if the selective rollback removes too much.

Alternatives considered:

- Edit directly without snapshot. Rejected because the rollback is broad and destructive.
- Commit the current state to `main`. Rejected unless the user explicitly wants a commit; a local patch/snapshot is enough for rollback safety.

### Decision: Revert by surfaces, not by timestamp alone

The ten post-checkpoint changes overlap heavily in the same files, especially `documents.shared.ts`, recipe assets, parser modules, and tests. Implementation should revert surfaces in this order:

1. Frontend SD item preview/submission behavior.
2. Structured SD item parser/PDF/intake behavior.
3. Prompt-facing item evidence and semantic-summary modules.
4. Multi-item DFD/ETP/TR/Minuta recipe changes after the checkpoint.
5. Tests and OpenSpec artifacts that only support removed behavior.

This order reduces dependency tangles: UI depends on model types, prompt behavior depends on parser metadata, and tests depend on all of them.

### Decision: Preserve Minuta recipe quality as a positive assertion

The rollback must not accidentally restore an older, weaker Minuta. Verification should include assertions that the Minuta recipe still contains the post-checkpoint architectural expectations: fixed/semi-fixed/conditional architecture, contractual role separation, type-aware modules, conservative placeholders, and anti-hallucination rules.

Alternatives considered:

- Only test that removed behavior is gone. Rejected because the most important risk is over-rollback past the target checkpoint.

## Risks / Trade-offs

- [Risk] The rollback removes pre-checkpoint work because the changes are uncommitted and interleaved. -> Mitigation: create a pre-rollback snapshot and verify against checkpoint requirements, not only against file names.
- [Risk] Recipe files may mix Minuta checkpoint improvements with later multi-item guidance. -> Mitigation: preserve Minuta-specific contractual-quality content while removing post-checkpoint semantic-summary/item-evidence language.
- [Risk] Tests may pass after deleting coverage but behavior may still be wrong. -> Mitigation: update tests to positively assert both removed post-checkpoint behavior and preserved checkpoint behavior.
- [Risk] Untracked OpenSpec change directories may remain and make status confusing. -> Mitigation: decide during implementation whether historical directories should remain as records or be removed from active working state, and document that decision.
- [Risk] Database migration files introduced after the checkpoint may be accidentally left behind. -> Mitigation: audit migrations and schema diffs for post-checkpoint-only changes, then restore the journal/schema consistently.

## Migration Plan

1. Capture a local backup of the current working tree, including tracked and untracked files.
2. Inventory files touched by the ten post-checkpoint changes and classify them as remove, restore, or preserve.
3. Remove frontend SD item-array preview/submission behavior and restore process creation UI/model tests to checkpoint expectations.
4. Restore SD parser/PDF/intake behavior to legacy representative item extraction and source traceability.
5. Remove `objectSemanticSummary`, `objectItemEvidence`, multi-item consolidation helpers, and related prompt fields from document generation.
6. Restore DFD, ETP, TR, and Minuta recipe assets to checkpoint content, preserving only the Minuta quality improvements from `elevate-minuta-contractual-quality`.
7. Remove files and tests that only support the ten post-checkpoint changes.
8. Run focused API document recipe tests, process intake/parser tests, frontend process creation tests, TypeScript checks where available, and `openspec validate rollback-to-elevate-minuta-contractual-quality --strict`.
9. If validation shows accidental over-rollback, recover from the backup and reapply the smaller intended restoration.

## Open Questions

- Should the implementation remove the ten post-checkpoint OpenSpec change directories from `openspec/changes`, or keep them as historical planning artifacts while reverting code behavior?
- Should the pre-rollback snapshot be a local patch file, a temporary branch commit, or both?

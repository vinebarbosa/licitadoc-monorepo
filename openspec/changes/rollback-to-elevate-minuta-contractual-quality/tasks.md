## 1. Safety Snapshot And Inventory

- [x] 1.1 Create a recoverable backup of the current working tree, including tracked changes and untracked files.
- [x] 1.2 Record the current `git status --short` output and list untracked files introduced by post-checkpoint changes.
- [x] 1.3 Inventory files touched by the ten post-`elevate-minuta-contractual-quality` changes and classify each file as preserve, restore, or remove.
- [x] 1.4 Confirm which OpenSpec change directories should remain as historical artifacts and which, if any, should be removed from the active working tree.

## 2. Frontend Process Creation Rollback

- [x] 2.1 Restore process creation form types and request builders to the checkpoint behavior without `sourceMetadata.extractedFields.items` submission.
- [x] 2.2 Remove the `Itens da SD` applied-items UI and import-dialog item preview behavior introduced after the checkpoint.
- [x] 2.3 Restore frontend PDF/parser model behavior to the checkpoint representative item extraction flow.
- [x] 2.4 Update frontend process creation, process model, and fixture tests to remove post-checkpoint structured item expectations.

## 3. Expense Request Intake Rollback

- [x] 3.1 Restore backend SD text parser behavior to checkpoint process-field and representative item extraction.
- [x] 3.2 Remove structured item arrays, component hierarchy extraction, item-structure diagnostics, and scalable item parsing helpers introduced after the checkpoint.
- [x] 3.3 Restore PDF extraction/normalization behavior to deterministic checkpoint text extraction without post-checkpoint item-table reconstruction.
- [x] 3.4 Restore process creation/intake source metadata behavior so it preserves checkpoint traceability without structured item arrays or item diagnostics.
- [x] 3.5 Update backend parser, PDF, process intake, and process creation tests to match checkpoint expectations.

## 4. Document Generation Rollback

- [x] 4.1 Remove or neutralize `objectSemanticSummary`, `objectItemEvidence`, multi-item object consolidation, dominant-item rationale, semantic primary groups, and related prompt authority fields.
- [x] 4.2 Restore DFD, ETP, TR, and Minuta prompt assembly to the checkpoint context shape.
- [x] 4.3 Preserve Minuta prompt safeguards introduced by `elevate-minuta-contractual-quality`, including fixed clause stability, contractual role separation, conditional modules, and conservative placeholders.
- [x] 4.4 Remove files that only support post-checkpoint semantic-summary or structured item-evidence behavior.
- [x] 4.5 Update document generation and prompt tests to assert removed post-checkpoint semantic layers and preserved Minuta checkpoint safeguards.

## 5. Recipe Asset Restoration

- [x] 5.1 Restore DFD instructions and template to checkpoint behavior without post-checkpoint multi-item consolidation, semantic-summary, item-evidence, or heuristic-language rules.
- [x] 5.2 Restore ETP and TR instructions/templates to checkpoint behavior without post-checkpoint structured item evidence or semantic primary-group authority.
- [x] 5.3 Preserve Minuta instructions/template improvements from `elevate-minuta-contractual-quality`.
- [x] 5.4 Remove later Minuta semantic-summary or structured item-evidence language while keeping contractual-quality guidance intact.
- [x] 5.5 Update repository-managed recipe tests for DFD, ETP, TR, and Minuta to match the checkpoint.

## 6. Schema, Migrations, And OpenSpec Cleanup

- [x] 6.1 Audit database schema and migration changes for post-checkpoint-only additions and restore checkpoint consistency.
- [x] 6.2 Remove or restore untracked files introduced only by post-checkpoint changes.
- [x] 6.3 Update OpenSpec artifacts as needed so this rollback change remains apply-ready and validates strictly.
- [x] 6.4 Confirm no unrelated pre-checkpoint code or artifacts were removed.

## 7. Verification

- [x] 7.1 Run focused API document-generation recipe and prompt tests.
- [x] 7.2 Run focused backend process intake/parser/PDF tests.
- [x] 7.3 Run focused frontend process creation and process model tests.
- [x] 7.4 Run relevant TypeScript typecheck targets for touched API and web packages.
- [x] 7.5 Run `openspec validate rollback-to-elevate-minuta-contractual-quality --strict`.
- [x] 7.6 Review final `git status --short` and summarize restored checkpoint behavior, deleted post-checkpoint surfaces, and any remaining intentional files.

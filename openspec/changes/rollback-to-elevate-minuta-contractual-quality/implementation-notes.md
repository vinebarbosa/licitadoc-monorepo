## Implementation Notes

### Backup

- Backup directory: `/private/tmp/licitadoc-rollback-backup-20260510-211533`
- Contains:
  - `git-status-short.txt`
  - `tracked-changes.diff`
  - `untracked-files.zlist`
  - `untracked-files.tar.gz`

### Inventory Decision

- Preserve historical OpenSpec change directories, including the ten post-checkpoint changes, as planning records.
- Revert code behavior and tests to the checkpoint instead of deleting historical change artifacts.
- Keep this rollback change directory active until implementation is complete and archived.

### Initial Classification

- Remove or neutralize:
  - `apps/api/src/modules/documents/object-semantic-summary.ts`
  - `objectSemanticSummary`, `objectItemEvidence`, `primaryGroups`, `summaryLabel`, `dominantItem`, `consolidatedObject`, and related prompt fields
  - structured SD item arrays and item diagnostics from backend parser/intake/PDF flow
  - frontend `Itens da SD` preview/submission behavior
  - tests that assert post-checkpoint semantic-summary, item-evidence, multi-item consolidation, or structured item-array behavior
- Preserve:
  - Minuta contractual-quality recipe architecture from `elevate-minuta-contractual-quality`
  - document lifecycle, live generation/event behavior, text adjustment behavior, provider configuration, and UI changes from changes older than the checkpoint
  - process title migration and concise title behavior from changes older than the checkpoint

### Cleanup Audit

- Database audit: `processes.title`, `0011_add_process_title.sql`, and the migration journal entry are pre-checkpoint concise-title artifacts and remain intentionally preserved.
- Removed post-checkpoint-only semantic summary support file `apps/api/src/modules/documents/object-semantic-summary.ts`.

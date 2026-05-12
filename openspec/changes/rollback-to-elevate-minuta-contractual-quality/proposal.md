## Why

The current working tree contains the effects of ten local OpenSpec changes after `elevate-minuta-contractual-quality`, but the desired product state is the code exactly as it stood immediately after that eleventh change from the prior evening. Because those changes were not committed as separate Git snapshots, this rollback needs an explicit, reviewable change plan instead of a destructive Git reset.

## What Changes

- Restore document generation behavior to the post-`elevate-minuta-contractual-quality` baseline.
- Preserve the improved Minuta recipe architecture, fixed clause stability, richer semi-fixed clauses, conditional contractual modules, and related Minuta safeguards from `elevate-minuta-contractual-quality`.
- Remove or neutralize document-generation behavior introduced after that checkpoint, including multi-item object consolidation, object semantic summary, structured item-evidence prompt authority, relaxed semantic-generation changes, and DFD-specific multi-item wording refinements.
- Restore SD intake and PDF parsing behavior to the pre-structured-item baseline, keeping the legacy representative `item`/item description flow used by the checkpoint.
- Remove frontend process-creation item preview/submission behavior introduced after the checkpoint, including `Itens da SD` UI and `sourceMetadata.extractedFields.items` form submission.
- Remove code, tests, recipes, migrations, and OpenSpec artifacts that only exist to support the ten post-checkpoint changes, while avoiding unrelated rollback of older completed work.
- Add verification steps that prove the codebase matches the intended checkpoint behavior and still passes focused Minuta/document-generation/process tests.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: restore prompt/context assembly to the checkpoint behavior that existed after `elevate-minuta-contractual-quality`, without post-checkpoint semantic-summary or structured multi-item item-evidence behavior.
- `document-generation-recipes`: preserve the Minuta quality improvements from the checkpoint while reverting DFD, ETP, TR, and later Minuta recipe changes introduced by post-checkpoint changes.
- `expense-request-process-intake`: restore SD text intake to the checkpoint behavior that extracts process data and legacy representative item context without persisting structured item arrays introduced later.
- `expense-request-pdf-intake`: restore PDF intake normalization/extraction to the checkpoint behavior and remove post-checkpoint item-table cleanup/structured item parsing rules.

## Impact

- Affects backend document generation context and recipes under `apps/api/src/modules/documents`.
- Affects SD intake/parser/PDF modules under `apps/api/src/modules/processes`.
- Affects frontend process creation and process model code under `apps/web/src/modules/processes`.
- Affects tests for document recipes, document generation, process intake/PDF parsing, and process creation UI.
- May delete files introduced only by post-checkpoint changes, including semantic-summary modules, document-generation event/text-adjustment files if they are outside the checkpoint, and structured item preview assets.
- Does not intentionally change authentication, organization management, departments, document lifecycle, provider configuration, or database state beyond removing post-checkpoint code-only additions that are not part of the target checkpoint.

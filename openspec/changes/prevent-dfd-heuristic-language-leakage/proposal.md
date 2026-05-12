## Why

Recent DFD multi-item refinements improved object aggregation, quantity suppression, and natural wording, but the final DFD can still echo internal generator terminology such as "item dominante", "grupos identificados", "consolidação", or "agrupamento".

This change prevents heuristic-language leakage by introducing a DFD-safe view of object consolidation: the system may keep using internal heuristics, but the DFD prompt and recipe must expose only document-facing language.

## What Changes

- Add a DFD-safe adaptation layer for object consolidation context used by DFD prompt assembly.
- Keep internal fields such as `kind`, `dominantItem`, `itemGroups`, `guidance`, and `rationale` available to the system, but stop exposing heuristic labels directly in DFD prompts.
- Replace DFD prompt labels like "Item dominante da origem", "Grupos de itens identificados", "Orientação de consolidação do objeto", and "Racional da consolidação" with document-facing fields such as materials to mention, suggested object wording, and source-grounded drafting cautions.
- Update DFD recipe guidance so it tells the model not to verbalize internal reasoning, consolidation rules, or editorial heuristics in the final document.
- Keep multi-item aggregation behavior, lexical fidelity, no-quantity rules, natural wording, and unitary-object behavior intact.
- Add focused tests ensuring DFD prompts and recipe assets avoid heuristic leakage while still preserving concrete item groups for drafting.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: DFD prompt assembly MUST use a document-facing, DFD-safe object context instead of exposing internal consolidation heuristics and rationale as drafting material.
- `document-generation-recipes`: The DFD recipe MUST prohibit final document wording that explains generator decisions, consolidation heuristics, or internal editorial rules.

## Impact

- Affects DFD prompt assembly in `apps/api/src/modules/documents/documents.shared.ts`.
- Affects DFD recipe assets in `apps/api/src/modules/documents/recipes/dfd-instructions.md` and `apps/api/src/modules/documents/recipes/dfd-template.md`.
- Affects focused document generation recipe/context tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts`.
- Does not change public APIs, database schema, source extraction, object consolidation heuristics, ETP, TR, Minuta behavior, provider configuration, document lifecycle, frontend behavior, or stored documents.

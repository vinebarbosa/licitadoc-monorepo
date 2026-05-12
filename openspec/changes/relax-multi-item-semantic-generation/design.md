## Context

The recent multi-item sequence added increasingly strong semantic interpretation between SD evidence and document drafting. The useful outcome is structured item evidence: the system can extract, display, and persist multiple SD items. The problematic outcome is that document prompts now treat `objectSemanticSummary` and its derived labels as the authoritative object interpretation, which can make generated text sound artificial, overconstrained, or disconnected from the original object.

This rollback is selective. It should not remove the process-creation item preview, the `sourceMetadata.extractedFields.items` payload, or parser work that preserves top-level SD rows and components. It should relax only the document-generation layer that turns those items into mandatory semantic labels and dense prompt rules.

## Goals / Non-Goals

**Goals:**

- Preserve structured SD item evidence as factual context.
- Remove or neutralize `objectSemanticSummary` as a mandatory drafting authority.
- Restore the original process object and legacy item description as valid drafting context.
- Keep a simple anti-first-item-collapse guardrail without complex semantic grouping.
- Simplify DFD, ETP, TR, and Minuta recipes so they guide natural drafting rather than exposing implementation heuristics.
- Keep existing public APIs, database schema, provider configuration, and document lifecycle unchanged.

**Non-Goals:**

- Do not remove the frontend `Itens da SD` section or process creation item persistence.
- Do not build a new semantic engine or replacement consolidation layer.
- Do not special-case object types such as school kits, event supplies, cleaning supplies, or commemorative items.
- Do not change model/provider selection as part of this rollback.
- Do not archive or delete historical OpenSpec changes as part of implementation.

## Decisions

1. Treat SD items as factual evidence, not as pre-drafted semantics.

   The prompt may include a bounded list of extracted items and components, but it should not require the model to use `primaryGroups`, `summaryLabel`, `dominantPurpose`, or `shouldAvoid*` fields as the main source of object wording. This preserves visibility without forcing one intermediate interpretation.

   Alternative considered: fully remove structured item evidence from prompts. Rejected because that would reintroduce first-item blindness and waste the useful process-form item extraction work.

2. Prefer neutralization over destructive deletion.

   Implementation should remove prompt dependencies on `objectSemanticSummary` and recipes that require it, but can leave unused helpers or module files temporarily if that lowers rollback risk. Tests should assert behavior, not necessarily physical deletion.

   Alternative considered: revert each prior change exactly. Rejected because the last frontend item work and some parser improvements depend on related types and metadata.

3. Re-enable legacy object context when structured evidence exists.

   The system should stop aggressively suppressing `item.description` or process object context merely because `items` is available. Structured items should augment the object context, not replace it.

   Alternative considered: keep legacy suppression for DFD only. Rejected because the symptom is cross-document artificiality and inconsistent object wording.

4. Keep recipes simple and document-facing.

   Recipes should say: consider all item evidence, do not reduce the object to the first item, preserve concrete terms, and do not invent generic categories. They should not mention internal concepts such as semantic summary flags, group detection, consolidation rationale, or heuristic suppression.

   Alternative considered: add more detailed counter-instructions. Rejected because the current issue is already excess instruction density.

## Risks / Trade-offs

- Regression: multi-item drafts may again underrepresent later items if the provider ignores item evidence.
  - Mitigation: keep a concise item-evidence block and tests proving all top-level items are present in prompts.

- Regression: removing `objectSemanticSummary` guidance may reduce consistency between DFD, ETP, TR, and Minuta.
  - Mitigation: all document types should receive the same factual item evidence, but each recipe can draft naturally for its role.

- Risk: tests from previous semantic-summary changes may fail because they assert now-undesired prompt fields.
  - Mitigation: replace them with tests for simpler item evidence, absence of semantic-summary authority, and preservation of original object context.

- Trade-off: some semantic consolidation helpers may remain unused after implementation.
  - Mitigation: prefer small safe removals first; remove dead code only when typecheck and tests prove it is unreferenced.

## Migration Plan

1. Update document prompt context assembly so structured item evidence remains available but `objectSemanticSummary` fields are no longer emitted as required prompt lines.
2. Restore prompt inclusion of the process object and legacy item description even when structured items exist.
3. Simplify DFD, ETP, TR, and Minuta recipe assets by removing mandatory `objectSemanticSummary` instructions and replacing them with concise item-awareness guidance.
4. Update tests to assert the relaxed prompt shape and remove expectations tied to semantic-summary authority.
5. Run document-generation tests, process item-evidence tests, typecheck, and OpenSpec validation.

Rollback strategy: because the change is itself a relaxation, rollback means reintroducing the prior semantic-summary prompt fields and recipe requirements from version control if the simpler prompts regress badly.

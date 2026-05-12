## Why

Recent DFD multi-item changes corrected first-item bias, improper quantities, and generic over-abstraction, but generated DFDs can still sound artificially institutional and occasionally infer operational details not present in the SD.

This change tightens the DFD wording guidance so multi-item objects remain aggregated and faithful while using simpler, more concrete administrative language.

## What Changes

- Refine DFD recipe guidance for `multi_item` acquisitions to prefer concrete item group names over abstract umbrella phrases.
- Add guardrails against artificial expressions such as "grupos materiais diretamente relacionados", "materialização da ação", "suporte operacional" and "componentes auxiliares" when more concrete SD terms are available.
- Prevent unsupported operational inferences in DFD text, especially hygiene, technical protection, expanded safety, or delivery conditions not present in the source context.
- Simplify multi-item essential requirement examples so they remain administrative, proportional, and less TR-like.
- Preserve the existing DFD structure, multi-item aggregation behavior, no-quantity rule, and unitary-object behavior.
- Add focused tests for recipe/prompt wording that protect natural, concrete DFD guidance without increasing document density.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: The DFD recipe MUST guide multi-item wording toward natural, concrete, source-faithful administrative language and away from artificial institutional abstractions or unsupported operational inferences.
- `document-generation`: DFD prompt assembly MAY add targeted multi-item naturalness guidance, but MUST preserve existing object consolidation and quantity-suppression behavior.

## Impact

- Affects DFD recipe assets in `apps/api/src/modules/documents/recipes/dfd-instructions.md` and `apps/api/src/modules/documents/recipes/dfd-template.md`.
- May affect DFD prompt assembly in `apps/api/src/modules/documents/documents.shared.ts` if a context-level naturalness rule is needed for `multi_item`.
- Affects focused document generation recipe/context tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts`.
- Does not change public APIs, database schema, expense request parsing, object consolidation heuristics, provider configuration, document lifecycle, frontend behavior, ETP, TR, Minuta, or stored documents.

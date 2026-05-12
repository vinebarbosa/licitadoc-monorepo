## 1. Object Consolidation Context

- [x] 1.1 Review current process source metadata and document generation context fields for object, item description, raw source labels, and future item-array support.
- [x] 1.2 Add a deterministic multi-item object consolidation helper in the documents module or a nearby local helper.
- [x] 1.3 Support structured item arrays when present and fall back to process object, extracted object, item description, justification, and preserved source text.
- [x] 1.4 Detect composite acquisition signals such as kits, materiais diversos, acessórios, embalagens, insumos, brindes, cestas, higiene, limpeza, informática with accessories, saúde supplies, event support materials, and repeated related item groups.
- [x] 1.5 Detect unitary-object negative signals such as one software service, artistic presentation, vehicle, consulting service, specific work, or one clearly dominant item.
- [x] 1.6 Return structured consolidation fields including kind, original object, dominant item, identified groups, consolidated object, guidance, and rationale.
- [x] 1.7 Ensure consolidation never invents item groups, quantities, accessories, administrative purposes, or categories absent from source context.

## 2. Prompt Assembly

- [x] 2.1 Add consolidated object fields to `buildDfdGenerationContext` and inherited ETP/TR/Minuta contexts.
- [x] 2.2 Add concise prompt lines for consolidation type, original object, dominant item, identified groups, suggested consolidated object, and consolidation guidance.
- [x] 2.3 Ensure DFD prompts use consolidated object guidance for object and need context while preserving source item details.
- [x] 2.4 Ensure ETP prompts use consolidated object guidance to analyze composite acquisitions as a set.
- [x] 2.5 Ensure TR prompts use consolidated object guidance for delivery, receipt, conformity, and fiscalization across item groups.
- [x] 2.6 Ensure Minuta prompts use consolidated object guidance to formalize the broader object contractually.
- [x] 2.7 Keep unitary prompts free of misleading multi-item aggregation guidance.

## 3. Recipe Guidance

- [x] 3.1 Update DFD instructions/template guidance to avoid reducing multi-item acquisitions to the first or dominant item.
- [x] 3.2 Update ETP instructions/template guidance to analyze composite acquisitions as related sets of materials, kits, accessories, inputs, or support items.
- [x] 3.3 Update TR instructions/template guidance to structure execution and conformity for all identified item groups.
- [x] 3.4 Update Minuta instructions/template guidance to formalize consolidated composite objects without narrowing the contractual scope.
- [x] 3.5 Preserve existing anti-hallucination wording in all recipes and add explicit no-invented-categories rules.
- [x] 3.6 Preserve unitary-object behavior in all recipes by warning against excessive abstraction.

## 4. Tests

- [x] 4.1 Add unit tests for the object consolidation helper covering multi-item and unitary classifications.
- [x] 4.2 Add DFD prompt tests for material escolar, kits, brindes, event support materials, and materiais diversos.
- [x] 4.3 Add ETP prompt tests for composite solution analysis without first-item reduction.
- [x] 4.4 Add TR prompt tests for delivery, receipt, conformity, and fiscalization across item groups.
- [x] 4.5 Add Minuta prompt tests for contractual object breadth in composite acquisitions.
- [x] 4.6 Add representative scenarios for informática with accessories, limpeza, saúde supplies, and kits/hygiene.
- [x] 4.7 Add negative tests proving unitary objects such as software, artistic presentation, vehicle, consulting service, and specific work remain specific.
- [x] 4.8 Update process intake or parser tests if implementation preserves additional item metadata from source requests.

## 5. Validation

- [x] 5.1 Run `openspec validate consolidate-multi-item-contracting-object --strict`.
- [x] 5.2 Run focused backend document generation recipe and context tests.
- [x] 5.3 Run process intake/parser tests if related metadata extraction changes.
- [x] 5.4 Run API typecheck or the closest existing validation command if prompt-related TypeScript files are changed.

## 1. Consolidation Helper Fidelity

- [x] 1.1 Review current `consolidateContractingObject` grouping labels, signal patterns, and consolidated object formatting for over-broad category creation.
- [x] 1.2 Separate composite detection signals from displayable item-group labels so purpose/context words can classify but cannot become unsupported item groups.
- [x] 1.3 Prefer structured item arrays and source item/object text over justification or purpose text when building `itemGroups`.
- [x] 1.4 Replace broad labels such as event support, operational inputs, logistical components, or generic diverse materials with concrete source-grounded labels only when supported.
- [x] 1.5 Preserve concrete material groups such as recipientes, kits, embalagens, fitas, acessórios, itens de acondicionamento, materiais auxiliares, and insumos when present.
- [x] 1.6 Keep generic groups such as `materiais diversos` or `insumos` only when explicitly present or clearly materialized in the source context.
- [x] 1.7 Ensure unitary object detection remains unchanged.

## 2. Prompt Context

- [x] 2.1 Update `objectSummary.itemGroups` and `objectSummary.consolidatedObject` wording to favor lexical fidelity over abstract parent categories.
- [x] 2.2 Update consolidation guidance text in prompt fields to warn against substituting concrete groups with artificial category-mother labels.
- [x] 2.3 Ensure DFD, ETP, TR, and Minuta prompts continue exposing consistent object summary fields.
- [x] 2.4 Ensure contextual purpose remains available through object/justification fields without becoming an unsupported material group.

## 3. Recipe Guidance

- [x] 3.1 Update DFD instructions/template with lexical fidelity guidance for multi-item objects.
- [x] 3.2 Update ETP instructions/template to analyze composite acquisitions using concrete source-grounded groups.
- [x] 3.3 Update TR instructions/template to operationalize delivery, receipt, conformity, and fiscalization around concrete item groups.
- [x] 3.4 Update Minuta instructions/template to formalize concrete composite scope without broadening to unsupported categories.
- [x] 3.5 Add explicit examples of generic expressions to avoid when unsupported, including `materiais de apoio a eventos`, `insumos operacionais`, `componentes logísticos`, `materiais diversos`, and `componentes auxiliares`.
- [x] 3.6 Preserve existing anti-hallucination and unitary-object guidance.

## 4. Tests

- [x] 4.1 Update helper tests for the potes/kits/embalagens/fitas/materiais auxiliares case to assert concrete groups and reject `materiais de apoio a eventos`.
- [x] 4.2 Update representative family tests so event/distribution/festivity terms do not create unsupported material categories by themselves.
- [x] 4.3 Add prompt tests for DFD, ETP, TR, and Minuta verifying concrete item groups remain visible.
- [x] 4.4 Add negative tests rejecting unsupported generic labels when they are not present in source context.
- [x] 4.5 Keep tests proving unitary objects such as software, artistic presentation, vehicle, consulting service, and specific work remain specific.

## 5. Validation

- [x] 5.1 Run `openspec validate preserve-multi-item-object-fidelity --strict`.
- [x] 5.2 Run focused backend document generation recipe/context tests.
- [x] 5.3 Run API typecheck or the closest existing validation command for changed TypeScript files.

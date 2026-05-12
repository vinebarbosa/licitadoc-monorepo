## 1. DFD-Safe Context Design

- [x] 1.1 Review current DFD prompt object-summary fields in `documents.shared.ts` and identify internal labels exposed to DFD prompts.
- [x] 1.2 Add a DFD-safe object context adapter derived from the existing internal object consolidation summary.
- [x] 1.3 Ensure the adapter exposes document-facing fields such as materials to mention, suggested administrative object wording, and drafting cautions.
- [x] 1.4 Ensure the adapter does not expose internal labels such as dominant item, consolidation guidance, consolidation rationale, identified groups, or semantic grouping as DFD prompt labels.
- [x] 1.5 Keep the original object consolidation summary unchanged for internal use and non-DFD document prompts.

## 2. DFD Prompt Assembly

- [x] 2.1 Replace DFD prompt lines that expose `Tipo de consolidação do objeto`, `Item dominante da origem`, `Grupos de itens identificados`, `Orientação de consolidação do objeto`, and `Racional da consolidação` with DFD-safe document-facing lines.
- [x] 2.2 Preserve concrete materials and suggested object wording in the DFD prompt without describing the consolidation process.
- [x] 2.3 Preserve existing multi-item safeguards against first-item focus, individual quantities, units, lots, values, and full item specifications.
- [x] 2.4 Confirm ETP, TR, and Minuta prompt assembly keep their existing object-summary behavior.

## 3. DFD Recipe Guidance

- [x] 3.1 Update `dfd-instructions.md` to prohibit final-document wording that explains internal generator reasoning or object interpretation.
- [x] 3.2 Replace or rephrase recipe guidance that might cause the model to echo "item dominante", "consolidação", "agrupamento", "grupos identificados", or similar heuristic vocabulary.
- [x] 3.3 Update `dfd-template.md` object guidance to use document-facing phrases such as "conjunto dos materiais previstos" or concrete material names.
- [x] 3.4 Ensure template requirements remain administrative and do not explain grouping, consolidation, abstraction, or source-selection rules.

## 4. Tests

- [x] 4.1 Add or update DFD prompt tests asserting internal heuristic labels are not present in DFD prompts.
- [x] 4.2 Assert DFD prompts still expose concrete material groups and suggested administrative object wording for multi-item acquisitions.
- [x] 4.3 Assert DFD recipe assets prohibit final text that explains generator decisions or consolidation heuristics.
- [x] 4.4 Assert ETP, TR, and Minuta prompt tests continue to pass with existing object-summary context.
- [x] 4.5 Preserve existing tests for multi-item aggregation, quantity suppression, lexical fidelity, natural wording, and unitary DFD behavior.

## 5. Validation

- [x] 5.1 Run `openspec validate prevent-dfd-heuristic-language-leakage --strict`.
- [x] 5.2 Run focused backend document generation recipe/context tests.
- [x] 5.3 Run API typecheck or closest existing validation command for changed TypeScript files.

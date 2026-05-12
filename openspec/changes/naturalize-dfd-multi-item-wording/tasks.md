## 1. DFD Recipe Naturalness

- [x] 1.1 Review current DFD multi-item wording in `dfd-instructions.md` and `dfd-template.md` for artificial abstractions and unsupported operational language.
- [x] 1.2 Update `dfd-instructions.md` to prefer concrete SD item groups and direct administrative language for multi-item objects.
- [x] 1.3 Add explicit guidance in `dfd-instructions.md` to avoid expressions such as "demais grupos materiais diretamente relacionados", "materialização da ação", "suporte operacional", and "componentes auxiliares" when concrete terms are available.
- [x] 1.4 Add explicit guidance in `dfd-instructions.md` against unsupported hygiene, technical protection, expanded safety, or secure-handling inferences.
- [x] 1.5 Preserve existing guidance against quantities, units, values, lots, first-item focus, and detailed specifications in multi-item DFDs.

## 2. DFD Template Examples

- [x] 2.1 Update `dfd-template.md` object guidance to favor phrases like "kits, embalagens e materiais auxiliares" over abstract umbrella language.
- [x] 2.2 Simplify `dfd-template.md` essential requirement examples to use natural administrative terms such as "materiais em condições adequadas de uso e fornecimento".
- [x] 2.3 Ensure examples avoid unsupported claims about hygiene, technical protection, special safety, or operational execution.
- [x] 2.4 Keep the DFD role boundary intact so requirements do not become TR-style execution, inspection, acceptance, or conformity rules.

## 3. Prompt Assembly

- [x] 3.1 Decide whether the existing recipe guidance is sufficient or whether `buildDfdGenerationPrompt` needs a short `multi_item` naturalness rule.
- [x] 3.2 If prompt guidance is added, scope it only to DFD prompts where `objectSummary.kind` is `multi_item`.
- [x] 3.3 Ensure unitary DFD prompts do not receive forced aggregated item-group wording.
- [x] 3.4 Preserve visibility of consolidated concrete item groups in multi-item DFD prompts.

## 4. Tests

- [x] 4.1 Add or update DFD recipe asset tests for natural multi-item wording guidance.
- [x] 4.2 Assert the recipe or prompt rejects artificial phrases such as "demais grupos materiais diretamente relacionados" and "materialização da ação" when concrete terms are available.
- [x] 4.3 Assert unsupported hygiene, technical protection, or expanded safety inferences are discouraged unless source-supported.
- [x] 4.4 Assert positive examples keep concrete terms such as kits, embalagens, materiais auxiliares, acondicionamento, and distribuição.
- [x] 4.5 Preserve existing tests for multi-item aggregation, quantity suppression, lexical fidelity, and unitary DFD behavior.

## 5. Validation

- [x] 5.1 Run `openspec validate naturalize-dfd-multi-item-wording --strict`.
- [x] 5.2 Run focused backend document generation recipe/context tests.
- [x] 5.3 Run API typecheck or closest existing validation command if TypeScript files are changed.

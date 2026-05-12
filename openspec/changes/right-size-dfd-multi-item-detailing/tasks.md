## 1. DFD Prompt Assembly

- [x] 1.1 Review current DFD prompt fields for item description, item quantity, unit, unit value, and consolidated object summary.
- [x] 1.2 Add DFD-specific guidance when `objectSummary.kind` is `multi_item` stating that individual item quantity, unit, lot, item value, and full first-item specification must not be used in the final DFD object or essential requirements.
- [x] 1.3 Ensure the DFD prompt still exposes consolidated item groups and suggested consolidated object for aggregated object wording.
- [x] 1.4 Ensure unitary DFD prompts do not receive misleading multi-item suppression guidance.

## 2. DFD Recipe Guidance

- [x] 2.1 Update `dfd-instructions.md` to prohibit item-level quantity, unit, lot, value, and first-item technical specification in multi-item DFD object and requirements.
- [x] 2.2 Update `dfd-template.md` object guidance to describe multi-item acquisitions as aggregated material groups rather than first item plus quantity/specification.
- [x] 2.3 Update `dfd-template.md` essential requirements guidance with group-level examples suitable for multi-item acquisitions.
- [x] 2.4 Preserve the existing DFD role boundaries against ETP/TR/detailing.

## 3. Tests

- [x] 3.1 Add or update DFD prompt tests for a potes/kits/embalagens/materiais auxiliares source with first-item quantity `550`.
- [x] 3.2 Assert multi-item DFD prompts contain guidance rejecting individual quantity/unit/specification leakage.
- [x] 3.3 Assert multi-item DFD prompts keep aggregated item groups visible.
- [x] 3.4 Assert DFD recipe assets include group-level requirement guidance and point item-level detail to TR/item map/price research/subsequent instruments.
- [x] 3.5 Preserve existing tests for unitary DFD behavior and existing DFD role guidance.

## 4. Validation

- [x] 4.1 Run `openspec validate right-size-dfd-multi-item-detailing --strict`.
- [x] 4.2 Run focused backend document generation recipe/context tests.
- [x] 4.3 Run API typecheck or closest existing validation command for changed TypeScript files.

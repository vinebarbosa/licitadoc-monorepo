## 1. Semantic Summary Model

- [x] 1.1 Add a dedicated `ObjectSemanticSummary` type and document-safe prompt context shape for contracting-object interpretation.
- [x] 1.2 Move or adapt SD item/source evidence extraction helpers out of document prompt assembly into the semantic-summary layer.
- [x] 1.3 Implement deterministic summary building for object type, source item labels, primary groups, compact summary label, dominant purpose, complementary/accessory indicators, and detail flags.
- [x] 1.4 Implement conservative grouping rules that preserve lexical/material fidelity and reject unsupported generic labels.
- [x] 1.5 Preserve unitary object behavior with a fallback that keeps the specific source object and avoids forced aggregation.

## 2. Document Generation Integration

- [x] 2.1 Replace direct prompt-facing `ObjectConsolidationSummary` usage with `objectSemanticSummary` in DFD, ETP, TR, and Minuta context builders.
- [x] 2.2 Ensure all supported document prompts for the same process consume the same semantic-summary fields and field names.
- [x] 2.3 Remove prompt-facing dominant-item, consolidation-rationale, heuristic, and grouping-mechanics fields from DFD, ETP, TR, and Minuta prompt contexts.
- [x] 2.4 Adapt DFD-safe object handling to use summary label, primary groups, purpose, and detail flags without reintroducing document prose into the semantic layer.

## 3. Recipe Updates

- [x] 3.1 Update DFD recipe assets to treat `objectSemanticSummary` as authoritative administrative object context.
- [x] 3.2 Update ETP recipe assets to analyze the object from the provided semantic summary without regrouping SD items.
- [x] 3.3 Update TR recipe assets to operationalize around semantic primary groups and detail flags.
- [x] 3.4 Update Minuta recipe assets to formalize the same semantic object scope used by the other documents.
- [x] 3.5 Remove or revise recipe wording that encourages final prose to mention item dominance, grouping mechanics, consolidation rationale, or unsupported generic categories.

## 4. Tests and Verification

- [x] 4.1 Add semantic-summary tests for the potes/kits/embalagens/fita case, including concrete groups, complementary flags, purpose, and avoided generic labels.
- [x] 4.2 Add tests for accessories, explicitly source-supported generic labels, rejected unsupported generic labels, and unchanged unitary objects.
- [x] 4.3 Update prompt assembly tests to assert shared `objectSemanticSummary` context across DFD, ETP, TR, and Minuta.
- [x] 4.4 Update tests to assert final prompts omit dominant-item, rationale, heuristic, and grouping-mechanics leakage.
- [x] 4.5 Run the focused API document generation test suite and fix regressions.

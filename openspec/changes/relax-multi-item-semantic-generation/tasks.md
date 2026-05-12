## 1. Prompt Context Relaxation

- [x] 1.1 Identify all document prompt fields currently emitted from `objectSemanticSummary` and classify which are safe to remove, neutralize, or keep only as internal helper data.
- [x] 1.2 Update DFD prompt assembly so it includes factual item evidence and original process object context without requiring `objectSemanticSummary` prompt lines.
- [x] 1.3 Update ETP prompt assembly so structured item evidence augments, but does not replace, the stored object and source item description.
- [x] 1.4 Update TR prompt assembly so item rows and components remain visible as factual evidence without mandatory `primaryGroups` or `summaryLabel` wording.
- [x] 1.5 Update Minuta prompt assembly so contractual drafting can use the stored object and item evidence without semantic-summary authority.
- [x] 1.6 Stop suppressing legacy item description solely because structured `objectItemEvidence` is available.

## 2. Recipe Simplification

- [x] 2.1 Simplify DFD instructions and template to remove mandatory `objectSemanticSummary` usage and dense multi-item semantic rules.
- [x] 2.2 Simplify ETP instructions and template to use concise item-awareness guidance instead of semantic-summary-driven analysis.
- [x] 2.3 Simplify TR instructions and template to preserve all item evidence without forcing aggregated object group labels.
- [x] 2.4 Simplify Minuta instructions and template to preserve contractual scope without semantic-summary-driven wording.
- [x] 2.5 Remove document-facing references to internal terms such as `objectSemanticSummary`, `primaryGroups`, `summaryLabel`, `dominantPurpose`, `item dominante`, and semantic consolidation heuristics from final-drafting recipe guidance.

## 3. Preserve Structured Item Evidence

- [x] 3.1 Keep `sourceMetadata.extractedFields.items` intact for processes created from imported SDs.
- [x] 3.2 Keep frontend process creation item preview and applied `Itens da SD` behavior unchanged.
- [x] 3.3 Keep parser support for top-level item rows, row values, and components where it already exists.
- [x] 3.4 Ensure prompt item evidence remains bounded and factual, including item labels, row evidence, and components when available.

## 4. Tests

- [x] 4.1 Replace tests that require `objectSemanticSummary` prompt lines with tests that assert factual item evidence and original object context are present.
- [x] 4.2 Add DFD prompt tests proving multi-item evidence is visible without semantic-summary authority.
- [x] 4.3 Add ETP, TR, and Minuta prompt tests proving structured items augment rather than replace stored object context.
- [x] 4.4 Add recipe tests proving recipes no longer require `objectSemanticSummary` fields or internal semantic-consolidation terminology.
- [x] 4.5 Preserve or add regression tests proving generated prompts do not collapse multi-item SD evidence to the first item.
- [x] 4.6 Preserve frontend tests for SD item preview and `sourceMetadata.extractedFields.items` submission.

## 5. Verification

- [x] 5.1 Run focused API document-generation recipe tests.
- [x] 5.2 Run focused process item-evidence tests that cover SD item extraction/persistence.
- [x] 5.3 Run focused web process creation tests to confirm the latest item display change still works.
- [x] 5.4 Run relevant typecheck targets for touched API/web packages.
- [x] 5.5 Run `openspec validate relax-multi-item-semantic-generation --strict`.

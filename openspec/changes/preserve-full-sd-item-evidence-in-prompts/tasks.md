## 1. Parser and PDF Evidence Cleanup

- [x] 1.1 Add regression fixtures or inline fixture text based on the real Kit Escolar PDF extraction pattern, including repeated page headers and continued components.
- [x] 1.2 Improve PDF/text normalization so recurring page headers, address/CNPJ blocks, pagination markers, and system titles are suppressed from item evidence.
- [x] 1.3 Update top-level item segmentation so continuation fragments without row evidence do not become standalone procurement items.
- [x] 1.4 Ensure top-level item rows retain code, quantity, unit, unit value, and total value when those values are present in the SD table.
- [x] 1.5 Ensure nested components remain attached to their parent top-level item across page breaks.
- [x] 1.6 Add parser diagnostics for contaminated item labels, missing row values, partial components, and legacy fallback use.

## 2. Prompt-Facing Item Evidence Model

- [x] 2.1 Define an internal prompt-facing `objectItemEvidence` model or equivalent with availability, item count, line items, components, and diagnostics.
- [x] 2.2 Build item evidence from `sourceMetadata.extractedFields.items` while preserving item-to-component hierarchy.
- [x] 2.3 Add document-specific formatting budgets for DFD, ETP, TR, and Minuta.
- [x] 2.4 Suppress or clearly demote the legacy first-item `item.description` prompt field whenever reliable structured item evidence exists.
- [x] 2.5 Keep legacy representative item fallback for older processes or ambiguous item evidence.

## 3. Semantic Summary and Prompt Integration

- [x] 3.1 Keep `objectSemanticSummary` focused on semantic interpretation while moving full item hierarchy into `objectItemEvidence`.
- [x] 3.2 Add item-evidence prompt lines to DFD, ETP, TR, and Minuta generation contexts.
- [x] 3.3 Ensure DFD prompts expose all top-level items without requiring exhaustive component prose.
- [x] 3.4 Ensure ETP/TR prompts receive enough structured item evidence for technical and operational coherence.
- [x] 3.5 Ensure Minuta prompts receive enough item evidence to preserve contractual scope without becoming TR.
- [x] 3.6 Include item-evidence diagnostics in prompts so extraction risks are not misdiagnosed as provider issues.

## 4. Recipe Guidance

- [x] 4.1 Update DFD guidance to use `objectItemEvidence` for complete object awareness while writing administrative, aggregated text.
- [x] 4.2 Update ETP guidance to use item evidence for technical analysis without reinterpreting the SD independently.
- [x] 4.3 Update TR guidance to use item/component evidence for specifications, delivery, conformity, receiving, and fiscalization proportionally.
- [x] 4.4 Update Minuta guidance to preserve full contractual scope from item evidence without listing every component as a technical specification.
- [x] 4.5 Add guidance for partial evidence diagnostics: write conservatively and avoid inventing missing item groups.

## 5. Tests and Verification

- [x] 5.1 Add parser tests proving the real Kit Escolar extraction pattern yields exactly the expected top-level kit rows and no header-contaminated item labels.
- [x] 5.2 Add parser tests proving row values remain attached to the correct top-level items.
- [x] 5.3 Add parser tests proving components continued across page breaks remain associated with the correct parent item.
- [x] 5.4 Add prompt tests proving DFD/ETP/TR/Minuta include structured evidence for all top-level items.
- [x] 5.5 Add prompt tests proving the legacy first-item description is absent or demoted when structured item evidence is available.
- [x] 5.6 Add prompt tests proving document-specific item evidence detail levels differ appropriately between DFD, ETP, TR, and Minuta.
- [x] 5.7 Run focused process-intake and document-generation test suites.
- [x] 5.8 Run TypeScript typecheck and OpenSpec validation.

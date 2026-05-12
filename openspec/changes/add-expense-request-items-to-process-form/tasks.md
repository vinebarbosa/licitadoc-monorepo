## 1. Model Contract

- [x] 1.1 Extend the web process extraction types to represent `items`, item attributes, item components, raw item evidence, and item-structure diagnostics.
- [x] 1.2 Keep `extractedFields.item` and `itemDescription` typed as legacy compatibility fields while making `extractedFields.items` the complete item evidence source.
- [x] 1.3 Add small model helpers for reading applied item evidence from `ProcessCreationFormValues.sourceMetadata` without unsafe casts in the page.

## 2. Client-Side SD Item Parsing

- [x] 2.1 Align the frontend TopDown item-section normalization with the backend parser rules for repeated page headers, page numbers, system/footer noise, and row-value artifacts.
- [x] 2.2 Implement structured top-level item parsing for multi-item SDs, preserving code, description or label, quantity, unit, unit value, total value, and raw evidence.
- [x] 2.3 Implement component/attribute parsing for kit or composite item descriptions when component lines are present.
- [x] 2.4 Populate `extractedFields.items` and item-structure diagnostics from `parseTopDownExpenseRequestText`.
- [x] 2.5 Preserve the previous single-item behavior as fallback when structured item extraction is unavailable or partial.

## 3. Import Preview UI

- [x] 3.1 Add an item preview block to the `Importar SD TopDown` dialog showing item count and all extracted top-level rows.
- [x] 3.2 Show compact component information for composite items without expanding long technical text by default.
- [x] 3.3 Surface item extraction warnings/diagnostics inside the import dialog when structured evidence is partial or fallback-only.
- [x] 3.4 Confirm that canceling the dialog leaves existing applied item evidence and process fields unchanged.

## 4. Applied Form UI And Submission

- [x] 4.1 Add an `Itens da SD` section to the process creation form after an import is applied.
- [x] 4.2 Render applied items responsively with stable columns or mobile rows for description/label, code, quantity, unit, and value fields.
- [x] 4.3 Allow composite item components to be inspected from the applied item section without leaving the page.
- [x] 4.4 Ensure replacing an imported PDF refreshes both process-field suggestions and applied item evidence.
- [x] 4.5 Ensure `buildProcessCreateRequest` submits `sourceMetadata.extractedFields.items` and diagnostics for imported processes and does not fabricate items for manual processes.

## 5. Tests And Verification

- [x] 5.1 Add parser unit coverage for a multi-item TopDown SD fixture that previously collapsed to a single item.
- [x] 5.2 Add parser unit coverage for composite/kit items with components attached to the correct parent row.
- [x] 5.3 Add page tests asserting the import dialog previews all items before apply.
- [x] 5.4 Add page tests asserting the applied form shows `Itens da SD` and the submit payload includes `sourceMetadata.extractedFields.items`.
- [x] 5.5 Add page tests for cancel and replace flows preserving or refreshing item evidence correctly.
- [x] 5.6 Run the relevant web process tests, typecheck, and `openspec validate add-expense-request-items-to-process-form --strict`.

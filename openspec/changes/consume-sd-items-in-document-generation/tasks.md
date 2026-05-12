## 1. Source Item Context

- [x] 1.1 Inspect current document-generation context and prompt tests for singular `itemDescription`, `item.quantity`, `item.unit`, `item.unitValue`, and `item.totalValue` assumptions.
- [x] 1.2 Add a defensive metadata reader for `sourceMetadata.extractedFields.items[]` that returns normalized item rows with code, description, quantity, unit, unit value, and total value.
- [x] 1.3 Ignore empty reviewed item rows while preserving one valid item as a one-element item list.
- [x] 1.4 Add deterministic formatting for reviewed SD item rows, including item count and concise numbered item lines for prompt use.

## 2. Generation Context Integration

- [x] 2.1 Extend DFD generation context with reviewed item list fields such as item count, availability flag, normalized rows, and prompt-ready item-list text.
- [x] 2.2 Keep legacy singular item fields available as fallback when no usable reviewed item list exists.
- [x] 2.3 Update ETP analysis profile inference to consider the reviewed item list as a whole when it exists instead of using only the first item.
- [x] 2.4 Ensure estimate/price guidance does not synthesize an aggregate process value from per-item totals unless an existing process-level value is available.

## 3. Prompt Assembly

- [x] 3.1 Update DFD prompt assembly to emit the reviewed SD item-list block when available and omit first-item-only singular item lines in that branch.
- [x] 3.2 Update ETP prompt assembly to emit the reviewed SD item-list block when available and use legacy singular item lines only as fallback.
- [x] 3.3 Update TR prompt assembly to emit the reviewed SD item-list block when available and use legacy singular item lines only as fallback.
- [x] 3.4 Update Minuta prompt assembly to emit the reviewed SD item-list block when available and use legacy singular item lines only as fallback.

## 4. Recipe Guidance

- [x] 4.1 Update DFD instructions so the item list informs the overall demand without forcing exhaustive item-by-item drafting.
- [x] 4.2 Update ETP instructions so the item list informs need, feasibility, alternatives, and consistency checks without invented items.
- [x] 4.3 Update TR instructions so the item list can support object, specification, delivery, receiving, and obligation sections where relevant.
- [x] 4.4 Update Minuta instructions so the item list supports contractual object/execution clauses without copying TR-level technical detail.

## 5. Regression Coverage

- [x] 5.1 Add context tests proving multiple reviewed items are normalized and formatted into the generation context.
- [x] 5.2 Add prompt tests proving DFD, ETP, TR, and Minuta provider inputs include all reviewed item rows when `items[]` exists.
- [x] 5.3 Add prompt tests proving the first item is not presented as the sole item description when reviewed items exist.
- [x] 5.4 Add fallback tests proving legacy singular item metadata is still used for older processes without reviewed `items[]`.
- [x] 5.5 Add a single-item list test proving one reviewed item follows the item-list branch.

## 6. Validation

- [x] 6.1 Run focused API document-generation recipe/context tests.
- [x] 6.2 Run API typecheck or the closest available validation for document-generation changes.
- [x] 6.3 Run `openspec validate consume-sd-items-in-document-generation --strict`.

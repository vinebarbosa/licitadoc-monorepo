## Context

The current process creation page can import a TopDown Solicitação de Despesa PDF, preview general process fields, and apply those values to the form. After the rollback to the `elevate-minuta-contractual-quality` checkpoint, the SD extraction path intentionally preserves only a singular representative `item`.

The attached sample `SD DIAS DAS MAE.pdf` shows the gap clearly: the SD contains five item rows, but their descriptions are split across multiple text lines and each item is closed by a numeric row such as `0005910 550 0,00 0,00 KIT`. The user needs a visible process-level item area where those rows can be imported, reviewed, manually corrected, or manually entered before process creation.

Current frontend flow:

```text
PDF selected
    |
    v
browser extracts text
    |
    v
parser returns general process fields + item singular
    |
    v
import dialog previews general fields only
    |
    v
form submits sourceMetadata with representative item only
```

Target first-step flow:

```text
PDF selected or manual entry
    |
    v
Itens da SD editor owns reviewed rows
    |
    v
form values keep editable items
    |
    v
create payload writes sourceMetadata.extractedFields.items
```

## Goals / Non-Goals

**Goals:**

- Add a visible `Itens da SD` section to process creation.
- Let the actor add, edit, and remove item rows manually.
- Let the browser PDF parser extract a simple top-level item list from readable TopDown SD text.
- Preview extracted items before applying a PDF import.
- Persist reviewed rows through the existing `sourceMetadata.extractedFields.items` JSON path.
- Preserve the singular `sourceMetadata.extractedFields.item` compatibility field when there is at least one item.
- Keep implementation scoped to the frontend plus existing process creation metadata persistence.

**Non-Goals:**

- Add a normalized `process_items` table.
- Add item lifecycle management after process creation.
- Add catalog, quotation, budgeting, stock, or price-search workflows.
- Reintroduce `objectSemanticSummary`, semantic grouping, dominant item logic, or document-generation item evidence in this change.
- Extract nested kit components or semantic attributes in this first step.
- Change the backend direct PDF intake route unless needed only to keep metadata passthrough compatible.

## Decisions

### Decision: Use a simple reviewed item shape

Use one frontend type for both manual and PDF-extracted rows:

```ts
type ExpenseRequestFormItem = {
  id: string;
  code: string;
  description: string;
  quantity: string;
  unit: string;
  unitValue: string;
  totalValue: string;
  source: "manual" | "pdf";
};
```

Before submitting, strip UI-only fields and persist:

```ts
sourceMetadata.extractedFields.items = [
  {
    code: "0005910",
    description: "Kit com 2 (duas) unidades de potes plásticos...",
    quantity: "550",
    unit: "KIT",
    unitValue: "0,00",
    totalValue: "0,00"
  }
]
```

Rationale: this is enough to keep every SD row attached to the process without prematurely designing item lifecycle rules.

Alternatives considered:

- Full structured item/component model: useful later, but too close to the rolled-back semantic extraction work.
- Raw text only: preserves evidence but is not reviewable as process data.
- Database table now: larger backend/product decision than this first frontend slice.

### Decision: Keep items in form state, then merge into existing metadata

Add item rows to `ProcessCreationFormValues` as a first-class frontend field, then have `buildProcessCreateRequest` merge them into `sourceMetadata.extractedFields.items`.

If a PDF import already produced `sourceMetadata`, preserve the existing metadata and replace only the `items` and compatibility `item` fields with the reviewed rows.

If the actor manually adds items without importing a PDF, create minimal metadata:

```ts
sourceMetadata: {
  extractedFields: {
    item: firstReviewedItem,
    items: reviewedItems
  },
  source: {
    inputMode: "manual"
  },
  warnings: []
}
```

Rationale: the user can link SD items to the process immediately without a new backend table or endpoint.

### Decision: Manual items do not make the whole form an SD import

Manual item rows should persist in metadata, but they should not override process fields like object, justification, organization, department, or source reference. The item editor is an evidence area, not a second process-intake workflow.

For payload compatibility, the request may keep existing `sourceKind` and `sourceReference` values. When only manual items exist and no SD import was applied, the implementation can leave `sourceKind` and `sourceReference` as-is while still submitting `sourceMetadata`.

Rationale: this avoids surprising the actor by changing process identity fields just because they added item rows.

### Decision: PDF extraction uses row-boundary parsing only

The browser parser should look inside the item table section, accumulate description lines, and close an item whenever it sees a numeric row matching:

```text
<code> <quantity> <unitValue> <totalValue> <unit>
```

Example from the attached SD:

```text
Kit com 2 (duas) unidades de potes plásticos
(de no mínimo 1L) com tampa...
0005910 550 0,00 0,00 KIT
```

This yields one item with the accumulated description and row values.

Rationale: the TopDown text layout makes the numeric row the most stable delimiter. This keeps the parser deterministic and inspectable.

Alternatives considered:

- AI extraction: not appropriate for this first deterministic review workflow.
- Component inference: useful later, but would mix this UI/persistence slice with semantic extraction again.

### Decision: Show item editing in the main form and read/confirm in import preview

The import dialog should show extracted items with enough fields to catch obvious errors before applying. The main form should be the editable source of truth after import, with controls to add a row, remove a row, and edit each field.

Rationale: the actor can decide whether the parser got the PDF right, then correct rows before submission.

## Risks / Trade-offs

- [Risk] The frontend parser may miss unusual TopDown item layouts. -> Keep manual item editing available and add parser tests using the attached multi-item pattern.
- [Risk] Metadata-only persistence is less queryable than a normalized table. -> Accept for this first slice; a later `process_items` table can migrate from `sourceMetadata.extractedFields.items`.
- [Risk] Manual metadata without `sourceKind` can look less formal than imported metadata. -> Mark metadata source with `inputMode: "manual"` and keep source fields unchanged.
- [Risk] Long descriptions can make the form noisy. -> Use dense table layout on desktop and compact stacked rows on small screens.

## Migration Plan

- No database migration is required.
- Existing processes without `sourceMetadata.extractedFields.items` remain valid.
- New processes with reviewed items store them under existing JSON metadata.
- Rollback strategy is to ignore `sourceMetadata.extractedFields.items`; the existing singular `item` fallback remains available.

## Open Questions

- Should manually entered items set `sourceKind` to `expense_request`, or should `sourceKind` remain null unless a PDF import was applied?
- Should item editing also appear on the process detail/update page in a later change?
- Should backend direct PDF intake eventually share the same multi-item parser so API-created processes get the same metadata?

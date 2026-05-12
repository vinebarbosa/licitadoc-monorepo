## Context

The process creation page imports a TopDown SD PDF in the browser, extracts text locally, previews a small set of process fields, and then applies those suggestions to the editable form. The current frontend parser returns only `extractedFields.item` and `itemDescription`; it does not expose a full `items` array in the import result or in the visible form state.

The backend parser already has a richer structured item model with top-level items, row values, attributes, components, diagnostics, and warnings. Document generation now expects `sourceMetadata.extractedFields.items` when available. Because the web creation page submits through `POST /api/processes/` with reviewed form data, the item evidence must be carried by the form payload's existing `sourceMetadata`, not by a separate item table.

Current flow:

```text
PDF selected in browser
        |
        v
frontend text extraction
        |
        v
frontend SD parser
        |
        v
pending preview: process fields only
        |
        v
form values + sourceMetadata: item singular only
```

Target flow:

```text
PDF selected in browser
        |
        v
frontend text extraction
        |
        v
structured SD parser
        |
        v
pending preview: process fields + items
        |
        v
form values + sourceMetadata.extractedFields.items
        |
        v
document generation receives full SD item evidence
```

## Goals / Non-Goals

**Goals:**
- Show the extracted SD item list in the import preview and in the process creation form after the user applies the import.
- Preserve all top-level SD items in `sourceMetadata.extractedFields.items`.
- Preserve item hierarchy for kit/composite rows when component lines are present.
- Keep the legacy `item` field populated for compatibility, while treating `items` as the complete evidence source.
- Keep the UI compact and scannable for single-item and multi-item SDs.
- Add tests that prove a multi-item SD import does not collapse to the first item.

**Non-Goals:**
- Creating a normalized process-items database table.
- Adding catalog, quotation, budgeting, or inventory workflows.
- Making item rows a full spreadsheet editor.
- Replacing the existing process creation endpoint.
- Persisting the raw PDF binary in this web prefill flow.

## Decisions

### Decision: Store structured items in existing source metadata

Use `sourceMetadata.extractedFields.items` as the persistence path for imported SD items. The process table already stores arbitrary `sourceMetadata` JSON, and the document-generation pipeline already reads structured item evidence from that location.

Alternatives considered:
- Add a `process_items` table: too large for this change and would imply lifecycle, editing, and validation rules that the product does not currently have.
- Add first-class process fields for items: would bloat the process profile and duplicate source evidence.

### Decision: Keep `item` as compatibility fallback and make `items` complete

The extraction result should continue to populate `extractedFields.item` with a representative/legacy row so older code paths and warnings keep working. The complete list must live in `extractedFields.items`; UI and future document evidence should prefer `items` when present.

Alternatives considered:
- Replace `item` entirely: risks breaking existing tests and any callers that still expect singular item metadata.
- Derive UI rows from `itemDescription`: loses quantities, codes, hierarchy, and multi-item fidelity.

### Decision: Reuse the backend item structure shape in the frontend model

The frontend model should mirror the backend item evidence shape closely enough to avoid semantic drift:

```ts
type ExpenseRequestItemAttribute = {
  kind: string;
  text: string;
};

type ExpenseRequestItemComponent = {
  label: string;
  quantity: string | null;
  attributes: ExpenseRequestItemAttribute[];
  rawText: string;
};

type ExpenseRequestExtractionItem = {
  code: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitValue: string | null;
  totalValue: string | null;
  label?: string | null;
  components?: ExpenseRequestItemComponent[];
  attributes?: ExpenseRequestItemAttribute[];
  rawText?: string;
};
```

The implementation can port the backend parser logic into the existing browser parser or extract shared pure parsing helpers if that is low-friction. The important contract is the shape and tests, not a specific file boundary.

Alternatives considered:
- Call the backend PDF intake route: that route creates a process directly and bypasses the review form.
- Add a parse-only backend route now: cleaner long term, but larger API work. It can be a later refactor if parser drift becomes painful.

### Decision: Render items as review evidence, not a full editor

The initial UI should display a read-only or minimally editable review section with all extracted rows. It should show code, description/label, quantity, unit, total value, and component count/details where available. The user can still edit process-level fields and replace the PDF if extraction is wrong.

Alternatives considered:
- Inline row editing: useful eventually, but it requires validation, add/remove semantics, dirty tracking, and decisions about edited metadata versus source fidelity.
- Hide items only in metadata: does not solve the user's current visibility problem.

### Decision: Keep large item lists bounded and inspectable

The item section should be compact by default, with stable columns on desktop, card-like rows on mobile, and bounded/collapsible component details for long kits. The UI must not make the process form unusable for SDs with many rows.

Alternatives considered:
- Dump raw JSON/source text: accurate but unusable for the procurement workflow.
- Render every component fully expanded: good for tiny SDs, poor for kit-heavy PDFs.

## Risks / Trade-offs

- [Risk] The frontend parser can diverge from the backend parser again. -> Mitigation: mirror the structured item shape, use representative fixtures, and add tests that assert `items` is present in the submitted `sourceMetadata`.
- [Risk] Some TopDown PDFs may have noisy page headers in the item table. -> Mitigation: reuse the same normalization rules as the backend parser and surface warnings when structured extraction is partial.
- [Risk] Read-only items may not let the user correct a bad row immediately. -> Mitigation: keep replacement/manual process editing available and leave full item editing as a separate change.
- [Risk] Long kit/component descriptions can overwhelm the form. -> Mitigation: use compact summaries with expandable details and responsive constraints.

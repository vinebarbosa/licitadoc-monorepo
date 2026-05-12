## Why

Processes created from Solicitações de Despesa can now persist reviewed item rows in `sourceMetadata.extractedFields.items`, but document generation still treats the first item/`itemDescription` as the main item signal. This makes DFD, ETP, TR, and Minuta drafts lose the full SD item context and can produce shallow text that appears unaware of the remaining items.

## What Changes

- Make `sourceMetadata.extractedFields.items[]` the canonical SD item input for document-generation context when it is present and non-empty.
- Keep singular legacy fields such as `sourceMetadata.extractedFields.item` and `itemDescription` as fallback only for older processes or processes without reviewed item rows.
- Add deterministic prompt context for the SD item list, including item count and concise item lines with description, quantity, unit, unit value, and total value when available.
- Update DFD, ETP, TR, and Minuta prompt assembly/recipes so they instruct the provider to consider the full item list without turning every document into an exhaustive item-by-item specification.
- Preserve single-item SDs as a one-element `items[]` list; they should follow the same path as multi-item SDs.
- Do not add a normalized item table, change persistence, or reintroduce semantic summary/object grouping behavior in this change.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `document-generation`: Generation requests must use reviewed SD item lists from process source metadata as the primary item evidence when available, with legacy singular item fields only as fallback.
- `document-generation-recipes`: Document recipes must guide generated DFD, ETP, TR, and Minuta drafts to use the full SD item list proportionally and avoid collapsing the object to the first item.

## Impact

- Backend document-generation context and prompt assembly: `apps/api/src/modules/documents/documents.shared.ts`.
- Document-generation recipe instruction assets for DFD, ETP, TR, and Minuta where they reference SD item evidence.
- Existing process metadata shape remains compatible; no database migration or API schema change is expected.
- Tests: document-generation recipe/context tests proving prompts include all reviewed items, use fallback for legacy metadata, and do not rely on the first item as the sole item context.

## Why

DFD generation for multi-item acquisitions still exposes and reuses the first SD item too strongly, including quantity, unit, and individual specification details in the object and essential requirements. This makes the DFD look like an item table or TR fragment instead of an administrative demand document representing the acquisition as a set.

## What Changes

- Adjust DFD prompt/context behavior for `multi_item` acquisitions so item quantity, unit, individual item value, and first-item specification details are not used as primary DFD drafting material.
- Add explicit DFD guidance that multi-item objects must be described as aggregated material groups, not as the first table item with quantity/specification.
- Prevent DFD essential requirements from becoming item-level technical specifications, quantities, units, lots, or values.
- Keep concrete item groups visible and faithful to the SD, but route complete item-level detail to TR, item map, price research, or later instruments.
- Preserve unitary-object behavior, where specific quantity/unit may still be relevant when the demand is genuinely a single item.
- Add focused tests for multi-item DFD prompts and recipe text to reject first-item quantity/specification leakage.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: DFD generation context MUST avoid emphasizing individual first-item quantity/unit/specification details when object consolidation is `multi_item`.
- `document-generation-recipes`: The DFD recipe MUST instruct the model to keep multi-item DFD object and essential requirements aggregated, administrative, and free of item-level quantities/specifications.

## Impact

- Affects DFD prompt assembly in `apps/api/src/modules/documents/documents.shared.ts`.
- Affects DFD recipe assets in `apps/api/src/modules/documents/recipes/dfd-instructions.md` and `apps/api/src/modules/documents/recipes/dfd-template.md`.
- Affects focused document generation recipe/context tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts`.
- Does not change public APIs, database schema, provider configuration, document lifecycle, frontend behavior, or stored documents.

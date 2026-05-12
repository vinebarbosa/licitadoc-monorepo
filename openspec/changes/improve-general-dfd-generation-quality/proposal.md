## Why

The current DFD recipe produces safe documents, but its output can be too generic, overly short, or accidentally tied to one reference case. We need the recipe to preserve the quality level observed in the approved DFD reference while remaining broadly applicable to any DFD subject, such as cultural events, administrative services, goods, works, technology, health, or education.

## What Changes

- Refine the canonical `dfd` recipe so it guides the model to generate robust, subject-aware DFDs without hardcoding any specific theme.
- Strengthen editorial rules that prevent generic filler, unsupported legal/value claims, invented facts, and Markdown artifacts such as inline code ticks around field values.
- Improve prompt context and normalization so the DFD prefers canonical organization/department names and uses extracted values, quantities, values, item descriptions, dates, and responsible roles only when reliably present.
- Add guidance for selecting requirements according to the nature of the object while keeping the same canonical DFD structure.
- Add tests that cover DFD quality across multiple object categories, not only the Carnaval/FORRO TSUNAMI example.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: the `dfd` recipe must generate high-quality, subject-aware DFDs for any process subject while remaining faithful to the provided process context and canonical DFD structure.

## Impact

- Affects backend DFD prompt assembly and recipe assets in `apps/api/src/modules/documents`.
- Affects DFD generation tests in `apps/api/src/modules/documents`.
- Does not change public API shapes, document lifecycle, database schema, generation provider selection, or frontend behavior.

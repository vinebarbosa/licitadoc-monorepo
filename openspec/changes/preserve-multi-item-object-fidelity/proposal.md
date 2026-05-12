## Why

The current multi-item object consolidation prevents first-item collapse, but can over-correct by replacing concrete SD items with broad categories such as "materiais de apoio a eventos". This weakens lexical fidelity, material concreteness, and semantic adherence to the original expense request.

## What Changes

- Refine multi-item object consolidation so it preserves real material item groups from the SD before applying broader semantic labels.
- Prefer concrete, source-grounded groups such as recipientes, kits, embalagens, fitas, acessórios, itens de acondicionamento, materiais auxiliares, or related inputs when they are actually present.
- Avoid generic parent categories unless the category is explicitly present or clearly supported by the original context.
- Remove or downgrade broad labels that can be triggered only by purpose/context, such as event support, operational inputs, logistical components, or generic diverse materials.
- Update DFD, ETP, TR, and Minuta recipe guidance to require lexical and material fidelity when using multi-item consolidation.
- Add tests proving the system aggregates without over-abstracting and keeps unitary objects unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: multi-item object consolidation must preserve lexical/material fidelity to source items and avoid unsupported generic categories.
- `document-generation-recipes`: DFD, ETP, TR, and Minuta recipes must instruct the model to use concrete source-grounded item groups rather than broad artificial categories.

## Impact

- Affects object consolidation logic in `apps/api/src/modules/documents/documents.shared.ts`.
- Affects document recipe assets in `apps/api/src/modules/documents/recipes`.
- Affects document generation recipe/context tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts`.
- Does not change public APIs, database schema, lifecycle, provider configuration, frontend behavior, or stored documents.

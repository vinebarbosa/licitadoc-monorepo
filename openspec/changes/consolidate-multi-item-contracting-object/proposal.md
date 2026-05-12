## Why

The current document generation pipeline can collapse multi-item purchase requests into a single dominant product, causing DFD, ETP, TR, and Minuta drafts to understate the actual scope of the contracting need. This change improves semantic fidelity by consolidating related products, kits, accessories, and auxiliary materials into a representative contracting object without inventing items or over-abstracting unitary procurements.

## What Changes

- Add multi-item object interpretation to the document generation context so prompts can distinguish unitary objects from composite acquisitions.
- Consolidate related items into an aggregated object summary when the source request contains multiple complementary products, kits, accessories, inputs, or support materials tied to the same administrative purpose.
- Preserve single-item behavior for unitary or clearly dominant objects such as a single software service, show, vehicle, consulting service, specific work, or one materially dominant product.
- Add structured prompt fields for the original object, dominant item, item/group summary, consolidated object guidance, and multi-item detection rationale when available.
- Add editorial rules to DFD, ETP, TR, and Minuta recipes so generated documents represent the full scope of composite acquisitions proportionally.
- Add tests covering material escolar, kits, brindes, informática with accessories, limpeza, saúde, events/materials of support, and materials diversos, while ensuring unitary objects are not over-aggregated.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: generation context assembly must detect and expose semantically consolidated contracting objects for multi-item, kit, accessory, and composite acquisition scenarios.
- `document-generation-recipes`: DFD, ETP, TR, and Minuta recipes must instruct the model to use the consolidated object guidance and avoid reducing composite acquisitions to a single item.

## Impact

- Affects document generation context assembly in `apps/api/src/modules/documents/documents.shared.ts`.
- May affect expense request intake metadata usage in `apps/api/src/modules/processes/expense-request-intake.ts` or parsing tests if extracted item/group metadata must be preserved.
- Affects repository-managed recipe assets for DFD, ETP, TR, and Minuta in `apps/api/src/modules/documents/recipes`.
- Affects focused document generation recipe tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts` and potentially process intake/parser tests.
- Does not change public APIs, database schema, document lifecycle, provider configuration, frontend behavior, or existing stored documents.

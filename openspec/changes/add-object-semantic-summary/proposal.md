## Why

Document generation currently interprets expense request items, consolidates the contracting object, chooses groupings, avoids first-item dominance, avoids over-abstraction, and writes the final document in the same step. This mixes semantic interpretation with editorial drafting, causing unstable object wording, heuristic leakage, artificial abstractions, and inconsistent object treatment across DFD, ETP, TR, and Minuta.

## What Changes

- Introduce an intermediate `objectSemanticSummary` capability that produces a reusable structured semantic representation of the contracting object before document drafting begins.
- Analyze SD item evidence to determine whether the object is unitary or multi-item, identify concrete material groups, complementary items, accessories, predominant purpose, and reusable labels.
- Preserve lexical fidelity to the real SD items while consolidating only semantically compatible groups.
- Prevent the semantic layer from generating final DFD, ETP, TR, Minuta, legal, contractual, or institutional narrative text.
- Feed DFD, ETP, TR, and Minuta prompt contexts from the same `objectSemanticSummary` so each document stops reinterpreting the SD independently.
- Remove heuristic/rationale fields from final document prompt contexts when they would leak reasoning such as dominant item, grouping mechanics, or consolidation rationale into generated prose.
- Add tests covering multi-item supplies, complementary items, accessories, avoided generic categories, shared interpretation across document types, and unitary object preservation.

## Capabilities

### New Capabilities

- `object-semantic-summary`: Structured semantic consolidation of the contracting object from SD item evidence, producing concrete reusable object interpretation without final document prose.

### Modified Capabilities

- `document-generation`: document prompt assembly must compute or retrieve one shared object semantic summary before drafting and pass the same structured interpretation to DFD, ETP, TR, and Minuta generation.
- `document-generation-recipes`: DFD, ETP, TR, and Minuta recipes must consume the provided semantic object summary as authoritative context and avoid reinterpreting item lists or exposing consolidation heuristics in final text.

## Impact

- Affects object consolidation logic currently in `apps/api/src/modules/documents/documents.shared.ts`.
- May introduce a dedicated semantic-summary module near document generation shared utilities.
- Affects prompt context assembly for DFD, ETP, TR, and Minuta in `apps/api/src/modules/documents/documents.shared.ts`.
- Affects repository-managed recipes in `apps/api/src/modules/documents/recipes`.
- Affects tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts` and possibly document prompt tests in `apps/api/src/modules/documents/documents.test.ts`.
- Does not require public API, database schema, provider, frontend, authentication, or lifecycle changes.

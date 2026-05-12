## Why

Recent multi-item object-generation changes improved item awareness but made generated DFD, ETP, TR, and Minuta drafts overly controlled by semantic consolidation heuristics. The system now needs to keep the good part, structured SD item visibility and persistence, while relaxing the document-generation layer so final drafts read more naturally and are not governed by an authoritative `objectSemanticSummary`.

## What Changes

- Keep structured SD item extraction, process-form item preview, and `sourceMetadata.extractedFields.items` persistence intact.
- Stop treating `objectSemanticSummary`, `primaryGroups`, `summaryLabel`, and `shouldAvoid*` flags as mandatory drafting authorities for DFD, ETP, TR, and Minuta.
- Replace heavy semantic-consolidation prompt fields with a simpler factual item-evidence context that helps the model see all SD items without forcing a prewritten interpretation.
- Re-enable the original process object and legacy item description as usable context instead of aggressively suppressing them whenever structured item evidence exists.
- Simplify DFD, ETP, TR, and Minuta recipe guidance to a small rule set: consider all available SD items, do not reduce the object to the first item, preserve source terminology, and do not invent generic categories.
- Remove or neutralize multi-item wording rules that created artificial phrasing, excessive abstraction, or editorial reasoning in final documents.
- Preserve unitary-object behavior and existing document lifecycle, provider configuration, APIs, and database schema.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: Prompt context assembly must treat structured SD items as factual evidence, not as an authoritative semantic summary that rewrites the contracting object before drafting.
- `document-generation-recipes`: DFD, ETP, TR, and Minuta recipes must stop requiring `objectSemanticSummary`-driven wording and instead use simpler item-awareness guidance.

## Impact

- Affects document prompt/context assembly in `apps/api/src/modules/documents/documents.shared.ts`.
- Affects or removes semantic-summary usage in `apps/api/src/modules/documents/object-semantic-summary.ts`.
- Affects DFD, ETP, TR, and Minuta recipe assets in `apps/api/src/modules/documents/recipes`.
- Affects document generation recipe tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts` and related document-generation tests.
- Does not remove frontend SD item preview, structured item persistence, process creation behavior, public APIs, database schema, document lifecycle, or provider configuration.

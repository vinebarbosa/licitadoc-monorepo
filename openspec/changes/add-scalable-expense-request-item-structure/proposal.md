## Why

The current SD intake collapses complex item tables into one large `item.description`, often from the first line item only. Document generation then receives weak evidence and can produce awkward or misleading object summaries, such as treating specification words like "embalagem" as material groups; this is not primarily an Ollama problem because the loss happens before the provider is invoked.

## What Changes

- Introduce scalable, source-grounded SD item structure extraction that preserves line items, nested kit/component composition, quantities, units, values, and item-level headings without hardcoding each procurement object type.
- Distinguish procurement item evidence from descriptive attributes/specification text so terms like embalagem, fabricante, certificação, gramatura, validade, dimensão, and composição do not become material groups unless they are actual item labels.
- Preserve hierarchical structures such as kits/lots/groups and their components in `sourceMetadata.extractedFields`, while keeping backward-compatible `item` fields for existing flows.
- Feed `objectSemanticSummary` and document generation from structured SD item evidence rather than a single collapsed item description.
- Add provider-diagnostic guidance/tests: if structured item evidence is coherent but generated prose remains incoherent, then evaluate prompt/provider behavior; until then, treat the root cause as evidence extraction and semantic representation.
- Add regression coverage using the Kit Escolar SD pattern and at least one non-kit multi-item SD pattern to prove the solution is structural and not special-cased.

## Capabilities

### New Capabilities

- `expense-request-item-structure`: Generic structured representation of SD item tables, line items, kit/lote/group hierarchy, component labels, and descriptive attributes for downstream semantic use.

### Modified Capabilities

- `expense-request-process-intake`: SD text intake must extract and persist structured item evidence instead of only a single flattened `item.description`.
- `expense-request-pdf-intake`: PDF intake must preserve enough text/layout evidence for the text parser to reconstruct item structure from machine-readable SD PDFs.
- `document-generation`: document prompt assembly must build semantic summaries from structured item evidence and expose enough evidence quality diagnostics to separate extraction failures from provider/model failures.
- `document-generation-recipes`: DFD, ETP, TR, and Minuta recipes must use the structured semantic evidence to write cohesive descriptions without listing excessive item specifications or inventing object categories.

## Impact

- Affects `apps/api/src/modules/processes/expense-request-parser.ts` and related parser tests.
- Affects `apps/api/src/modules/processes/expense-request-intake.ts` source metadata construction.
- Affects `apps/api/src/modules/processes/expense-request-pdf.ts` if line/page boundary preservation needs improvement.
- Affects `apps/api/src/modules/documents/object-semantic-summary.ts`.
- Affects document prompt assembly and recipe tests in `apps/api/src/modules/documents`.
- Does not require database schema changes, public API changes, frontend changes, or provider replacement.
- Does not introduce object-type-specific patches such as "kit escolar" special handling; the solution must generalize from SD table structure.

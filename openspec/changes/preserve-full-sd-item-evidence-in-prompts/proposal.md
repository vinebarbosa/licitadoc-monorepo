## Why

The current SD item-structure layer still lets the document prompt lose or distort item evidence before the AI writes the final document. In the real Kit Escolar SD, the parser detects page/header fragments as item labels, misses row values on some line items, and the final prompt still sends a detailed legacy first-item description while the remaining items arrive only as flattened semantic labels.

This keeps the original symptom alive: the generated DFD/ETP/TR/Minuta can look like it read the first item deeply and the rest only approximately. The fix now is to preserve a clean, bounded, hierarchical item-evidence block from SD intake all the way into document-generation prompts.

## What Changes

- Clean SD PDF/table parsing so page headers, footers, address blocks, and continuation fragments do not become procurement item labels.
- Preserve top-level SD line items with row evidence: label, code, quantity, unit, values, components, and diagnostics.
- Add a prompt-facing `objectItemEvidence` or equivalent structured context that keeps the hierarchy `line item -> components` visible to the AI.
- Stop sending the legacy first-item description as a dominant prompt field when structured item evidence is available.
- Keep DFD prompts high-level while still showing enough item evidence to avoid first-item hyperfocus.
- Let ETP/TR/Minuta receive proportionally richer item evidence, without dumping full technical specifications unless the section requires it.
- Add diagnostics that distinguish extraction gaps from semantic summarization and provider behavior.
- Add regression coverage using the real Kit Escolar extraction pattern: expected three kit rows, no header-contaminated item labels, and coherent prompt evidence for all kit rows.

## Capabilities

### New Capabilities
- `document-generation-item-evidence`: Prompt-facing structured SD item evidence for DFD, ETP, TR, and Minuta generation, preserving line-item hierarchy without forcing exhaustive specification prose.

### Modified Capabilities
- `expense-request-process-intake`: SD text intake must preserve clean top-level item rows and nested components without promoting page/header fragments or continuation text into item labels.
- `expense-request-pdf-intake`: PDF text extraction and normalization must preserve parseable item-table boundaries while suppressing recurring page/header noise from item evidence.
- `document-generation`: Document generation must use structured item evidence instead of a legacy first-item description when such evidence is available.
- `document-generation-recipes`: Recipes must guide each document type to use structured item evidence proportionally and avoid first-item hyperfocus.

## Impact

- Affected modules:
  - `apps/api/src/modules/processes/expense-request-parser.ts`
  - `apps/api/src/modules/processes/expense-request-pdf.ts`
  - `apps/api/src/modules/processes/expense-request-intake.ts`
  - `apps/api/src/modules/documents/object-semantic-summary.ts`
  - `apps/api/src/modules/documents/documents.shared.ts`
  - DFD/ETP/TR/Minuta recipe instruction/template assets
  - process and document-generation tests
- No database schema change is expected; structured evidence can continue to live in `sourceMetadata.extractedFields`.
- No provider change is required. Provider comparison remains a later diagnostic branch after prompt evidence is clean.

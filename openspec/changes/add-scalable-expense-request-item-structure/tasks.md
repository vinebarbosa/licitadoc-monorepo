## 1. Item Structure Model

- [x] 1.1 Define internal types for structured SD items, components, attributes, and item-structure diagnostics.
- [x] 1.2 Add parser helpers to normalize PDF/text lines while preserving page, line, and item-section boundaries.
- [x] 1.3 Implement generic top-level line-item detection using table headers, row codes, quantities, units, values, and repeated row boundaries.
- [x] 1.4 Implement generic nested component detection inside line items using numbering, separators, label markers, and parent/child boundaries.
- [x] 1.5 Implement attribute/specification classification so packaging, dimensions, certifications, manufacturer, composition, validity, and similar descriptive phrases are not promoted to item groups.

## 2. Intake Integration

- [x] 2.1 Extend `parseExpenseRequestText` output with structured `items[]` and item-structure diagnostics while keeping the legacy representative `item`.
- [x] 2.2 Persist structured item evidence in `sourceMetadata.extractedFields` during SD text/PDF intake.
- [x] 2.3 Adjust PDF text extraction only as needed to preserve parseable line/page boundaries without using generative reconstruction.
- [x] 2.4 Add warnings for ambiguous item structure and conservative fallback to the legacy representative item.

## 3. Semantic Summary Integration

- [x] 3.1 Update `objectSemanticSummary` to prefer structured item labels and components over flattened `item.description`.
- [x] 3.2 Exclude attribute-only terms from primary groups and summary labels unless they are explicitly item/component labels.
- [x] 3.3 Add compact component-family evidence for prompt context without dumping full technical specifications into DFD/ETP/TR/Minuta prompts.
- [x] 3.4 Add evidence-quality diagnostics to semantic prompt context so extraction issues can be distinguished from provider/model issues.

## 4. Recipe and Prompt Guidance

- [x] 4.1 Update DFD guidance to write cohesive high-level object descriptions from structured item families without saying known composition/details are undefined.
- [x] 4.2 Update ETP/TR/Minuta guidance to use structured item/component evidence proportionally and avoid exhaustive item-level prose unless the document section requires it.
- [x] 4.3 Add provider-diagnostic guidance/tests that treat bad output with bad evidence as extraction/semantic risk, not automatically as an Ollama issue.

## 5. Tests and Verification

- [x] 5.1 Add parser regression tests using the Kit Escolar SD text/PDF extraction pattern with multiple kit rows and nested components.
- [x] 5.2 Add parser tests for a non-kit multi-item SD to prove the solution is structural and not object-specific.
- [x] 5.3 Add tests proving specification attributes such as packaging, certification, dimensions, composition, and validity do not become semantic primary groups.
- [x] 5.4 Add prompt tests proving DFD/ETP/TR/Minuta receive coherent structured item evidence and omit misleading "details undefined" wording when the SD provides composition.
- [x] 5.5 Run focused process-intake and document-generation test suites and fix regressions.

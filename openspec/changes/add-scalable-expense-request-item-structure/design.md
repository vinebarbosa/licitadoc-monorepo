## Context

The Kit Escolar SD exposed a deeper intake problem. The PDF contains a table-like item section with multiple kit line items and many internal components, but the current parser extracts only one flattened `item.description`, mostly from the first item block. The later semantic layer then receives one large description and tries to infer material groups from raw prose. This makes descriptive words such as "embalagem" appear as if they were real item groups and leaves the generated DFD looking like the system struggled to read the full SD.

This failure is observable before document generation and before Ollama or any provider is called: parsed process metadata already lacks a reliable list of line items and nested components. The provider may amplify the weakness, but the primary fix is better structured evidence.

## Goals / Non-Goals

**Goals:**

- Extract a reusable, structured representation of SD item evidence from text/PDF intake.
- Handle complex SD tables generically, including multiple line items, lots/groups, kit-like bundles, and nested components.
- Separate real item labels from descriptive/specification attributes.
- Feed semantic object consolidation from structured item evidence instead of one collapsed description.
- Improve generated DFD/ETP/TR/Minuta cohesion without writing per-object patches for each procurement category.
- Add diagnostics that make it clear whether a bad document came from extraction quality, semantic consolidation, prompt/recipe behavior, or provider behavior.

**Non-Goals:**

- Do not replace Ollama or add a provider-specific workaround as the first response.
- Do not create a hardcoded "kit escolar" parser.
- Do not build a complete procurement taxonomy for every possible object.
- Do not require database schema changes unless implementation discovers that source metadata size or query behavior makes JSON metadata insufficient.
- Do not expose raw SD text through public API responses.
- Do not force generated DFDs to list every component or technical specification.

## Decisions

### Decision: Model SD item evidence as structural data, not object-specific categories

Introduce a generic item evidence model in source metadata, for example:

- `items[]`: top-level procurement line items from the SD table;
- `items[].label`: concise line item label, such as "KIT ESCOLAR: EDUCAÇÃO INFANTIL";
- `items[].quantity`, `unit`, `unitValue`, `totalValue`, `code`;
- `items[].components[]`: nested component labels when the line item is a kit/group/bundle;
- `items[].attributes[]`: descriptive phrases/specification attributes that are not standalone item groups;
- `itemStructureQuality`: confidence/diagnostic fields such as parsed line-item count, component count, and warnings.

This model is scalable because it follows the document's structure rather than naming each object type. A kit, cesta, lote, pacote, conjunto, group of services, or equipment bundle can all be represented as a top-level item with nested components when the SD text has that shape.

Alternative considered: add more material-group keywords to `object-semantic-summary.ts`. Rejected because keywords keep chasing symptoms and can still confuse attributes with items.

### Decision: Preserve PDF line/page evidence before parsing

The PDF extractor should preserve enough text boundaries for the parser to detect table sections and item starts. It does not need visual OCR, but it should avoid collapsing the entire item table into one line when machine-readable text contains useful line/page boundaries.

Alternative considered: parse only the normalized one-line text. Rejected because item boundaries, component starts, and table rows are structural signals.

### Decision: Distinguish component labels from specification attributes

The parser should classify extracted fragments by role:

- top-level line item: row-level item in the SD table with code/quantity/unit/value;
- component: numbered or clearly separated sub-item inside a bundle/group;
- attribute: descriptive detail, certification, dimensions, material composition, packaging statement, validity, manufacturer, or similar specification text.

This distinction should be rule-based and layout-aware, not based on procurement category. For example, "embalagem deve conter..." is an attribute unless the SD row/component label itself is "embalagem" or equivalent.

Alternative considered: let the language model decide during generation. Rejected because that returns interpretation to the drafting step and makes results provider-sensitive.

### Decision: Feed objectSemanticSummary from structured items

`objectSemanticSummary` should prefer `sourceMetadata.extractedFields.items` and their component labels over the legacy flattened `item.description`. It should produce compact labels like "kits escolares compostos por materiais didático-pedagógicos" or "aquisição de kits escolares para estudantes da rede municipal", with component families available as supporting evidence.

The summary should not over-detail the DFD. It should expose enough structure for cohesive writing:

- item families or top-level line items;
- component families;
- intended beneficiaries/purpose from object/justification;
- flags for avoiding quantities and specifications in high-level sections;
- extraction quality warnings.

Alternative considered: include all raw components directly in every prompt. Rejected because this can overload final drafting and recreate item-level verbosity.

### Decision: Treat provider issues as a later diagnostic branch

This change should not assume Ollama is the root problem. The system should first make the evidence coherent. If prompts contain structured item evidence and still produce incoherent prose, then the issue becomes prompt/provider behavior and can be tested by comparing stub/OpenAI/Ollama outputs or provider settings.

Alternative considered: switch providers now. Rejected because the current failure is reproducible in parsed metadata and semantic summary before provider invocation.

## Risks / Trade-offs

- [Risk] SD layouts vary widely. -> Mitigation: build structural heuristics around table headers, row values, item codes, quantities, units, line breaks, and repeated numbering instead of object-specific terms.
- [Risk] Parser can misclassify attributes as components. -> Mitigation: keep role diagnostics and tests for packaging/specification phrases that must not become groups.
- [Risk] More structured metadata increases prompt size. -> Mitigation: semantic summary should select compact evidence for prompts and keep raw details out of high-level DFD sections.
- [Risk] Complex layouts may still be ambiguous. -> Mitigation: emit warnings and degrade gracefully to legacy `item.description` rather than inventing structure.
- [Risk] Existing tests expect only one item. -> Mitigation: keep legacy `item` as the first/representative item for backward compatibility while adding `items[]`.

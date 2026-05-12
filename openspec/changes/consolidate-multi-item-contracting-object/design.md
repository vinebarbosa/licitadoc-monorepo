## Context

The current generation context for DFD, ETP, TR, and Minuta primarily exposes a process object and a single extracted `item.description`. In source requests with several related products, that single item can become the semantic anchor for every generated document. This creates under-scoped drafts such as "aquisição de potes" when the source also includes kits, embalagens, fitas, acessórios, or auxiliary materials tied to the same administrative purpose.

The desired behavior is not to make every object abstract. Unitary procurements should remain specific. The improvement is to add a conservative consolidation layer that can recognize when a request is a composite acquisition and provide the model with a better object summary and editorial instruction.

Lei n. 14.133/2021 reinforces the need for adequate object definition and proportional description of procurement needs, but this implementation should remain an internal semantic consolidation change, not a legal analysis feature.

## Goals / Non-Goals

**Goals:**

- Detect likely multi-item or composite acquisitions before prompt assembly.
- Produce a conservative consolidated object summary that represents the set rather than a single dominant item.
- Preserve original source details so generated documents can mention relevant groups without inventing items.
- Apply the consolidated object signal consistently to DFD, ETP, TR, and Minuta prompts.
- Add recipe guidance that tells the model when to aggregate and when not to aggregate.
- Keep unitary object behavior intact.

**Non-Goals:**

- Do not change public APIs, database schema, document lifecycle, frontend behavior, or provider configuration.
- Do not require an LLM call or external dependency for object consolidation.
- Do not invent item groups absent from source metadata or source text.
- Do not replace item-level quantities, units, prices, or technical descriptions when they are needed.
- Do not solve full line-item extraction if the parser only has a single item today; use available metadata and raw source text conservatively.

## Decisions

### Decision: Add a reusable object consolidation helper in document generation context

Implementation should add a small deterministic helper in `documents.shared.ts` or a nearby local module. The helper should inspect:

- process object;
- extracted `object`;
- extracted `item.description`;
- optional extracted item arrays if present now or in future metadata;
- raw/source text if available in `sourceMetadata`, when preserved;
- process justification and process type as secondary signals.

The helper should return structured context, for example:

- `objectSummary.kind`: `unitary` or `multi_item`;
- `objectSummary.originalObject`;
- `objectSummary.dominantItem`;
- `objectSummary.itemGroups`;
- `objectSummary.consolidatedObject`;
- `objectSummary.guidance`;
- `objectSummary.rationale`;

Exact naming can follow local TypeScript style, but the prompt should expose the key signals in clear Portuguese.

Alternatives considered:

- Only change recipe instructions.
  Rejected because the model would still see one dominant `item.description` with no structured warning that the object may be composite.
- Parse every source request into normalized line items first.
  Rejected for this change because it is broader and riskier than needed; the consolidation helper can consume line items later if parser support improves.

### Decision: Use conservative heuristics, not category invention

The helper should classify as `multi_item` when there are reliable signals such as:

- explicit item arrays or repeated item-like entries;
- object or item text containing lists with separators and procurement nouns;
- keywords such as kits, conjunto, materiais diversos, acessórios, embalagens, insumos, brindes, cestas, material escolar, limpeza, higiene, informática with accessories, saúde supplies, event support materials;
- multiple related product groups tied to one purpose.

It should stay `unitary` when:

- there is one item and no composite signal;
- the item is clearly a single service, show, software, vehicle, work, consulting service, or specific equipment;
- the apparent additional text is only purpose, location, date, or administrative justification;
- items are technically independent and not safely aggregable from available context.

### Decision: Consolidated object wording should be category-level and source-grounded

The helper should prefer phrasing such as:

- "aquisição de materiais escolares diversos";
- "aquisição de kits e materiais de higiene pessoal";
- "aquisição de materiais de apoio e distribuição";
- "aquisição de equipamentos e acessórios de informática";
- "aquisição de materiais e insumos de limpeza";
- "aquisição de materiais diversos para apoio à ação administrativa".

When known, it may include representative groups from source text. It must not create a group merely because it is common for the category. If only "mouse" appears, it must not add teclado, monitor, or cabos.

### Decision: Prompt assembly should show both original and consolidated signals

Prompt context should continue to include the source item description and original process object. It should add explicit lines such as:

- `- Tipo de consolidação do objeto: multi_item`
- `- Objeto consolidado sugerido: ...`
- `- Grupos de itens identificados: ...`
- `- Orientação de consolidação: ...`

Recipes should instruct the model to use the consolidated object when `multi_item`, but still preserve specific item groups and available quantities without pretending the summary is a full technical specification.

### Decision: Recipe guidance should be added to all four document families

DFD should represent the administrative need and object as a set.

ETP should analyze the solution as a composite acquisition instead of a single product.

TR should structure execution, delivery, conformity, and receipt for all groups of items.

Minuta should formalize the consolidated object contractually, avoiding an overly restrictive one-product object clause.

## Risks / Trade-offs

- [Risk] Over-aggregation can make a unitary object vague. -> Mitigation: require explicit composite signals and add unitary negative tests.
- [Risk] Under-aggregation can persist when only one item is extracted. -> Mitigation: inspect object/source text when available and add recipe rules warning against first-item reduction.
- [Risk] Category labels may invent scope. -> Mitigation: require item groups to be grounded in extracted metadata or source text.
- [Risk] Prompts may become noisy. -> Mitigation: add concise structured fields and avoid duplicating long raw source text.
- [Risk] Future parser improvements may create overlapping fields. -> Mitigation: design helper to prefer structured item arrays when available and fall back to text heuristics.

## Migration Plan

1. Add object consolidation helper and tests in the document generation module.
2. Add consolidated object fields to DFD/ETP/TR/Minuta generation context and prompts.
3. Update DFD, ETP, TR, and Minuta recipe instructions/templates with multi-item editorial guidance.
4. Add tests for composite acquisitions across materials, kits, brindes, informática, limpeza, saúde, events, and materials diversos.
5. Add tests proving unitary objects still remain specific.
6. Run OpenSpec validation, focused backend document generation tests, and API typecheck.
7. Roll back by removing the helper fields and recipe guidance; no data migration is required.

## Open Questions

- Should expense request parsing later preserve a normalized list of all line items from the source document?
- Should process titles also use the consolidated object summary, or should this change remain limited to generated document prompts?

## Why

The current Minuta generator is structurally safe and modular, but its variable clauses can still read like polished placeholders instead of a mature administrative contract. This change raises contextual and operational quality so the Minuta formalizes the execution logic described by the TR without becoming TR, ETP, legal opinion, or an over-detailed legacy model.

## What Changes

- Preserve the current Minuta architecture based on fixed clauses, semi-fixed clauses, conditional blocks, and contextual passages.
- Keep fixed clauses for prerogatives, alteration/readjustment, habilitation, publicity, omitted cases, and forum stable, allowing only minimal legal or fluency adjustments when explicitly needed.
- Enrich semi-fixed clauses for object, execution, payment, term, obligations, fiscalization, receipt/acceptance, penalties, and termination with contractual, contextual, conservative language.
- Add reusable conditional contractual modules by predominant object type: events/artistic presentations, software/IT, consulting/advisory, supply of goods, works/engineering, and continuing/general services.
- Teach the Minuta recipe to formalize the TR operation into legal-contractual obligations, execution rules, fiscalization, receipt, and payment support without copying TR headings or analytical content.
- Improve placeholder and missing-data behavior so absent facts remain safe, but wording sounds like a contract rather than repeated "not informed" or "when applicable" fragments.
- Strengthen tests for modular architecture preservation, fixed clause stability, conditional type variation, contextual execution language, and anti-hallucination protections.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: the `minuta` recipe must generate standardized, contextual, legally safe, operationally coherent administrative contract drafts using stable fixed clauses, richer semi-fixed clauses, and reusable conditional modules by contracting type.

## Impact

- Affects Minuta recipe assets in `apps/api/src/modules/documents/recipes/minuta.instructions.md` and `apps/api/src/modules/documents/recipes/minuta.template.md`.
- May affect Minuta prompt assembly and safeguards in `apps/api/src/modules/documents/documents.shared.ts`.
- May affect focused document-generation recipe tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts` and Minuta generation tests in `apps/api/src/modules/documents/documents.test.ts`.
- Does not change public APIs, database schema, frontend behavior, provider configuration, document lifecycle, or existing stored documents.

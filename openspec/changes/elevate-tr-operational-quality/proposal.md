## Why

The current TR generator is safe and structurally correct, but it is too conservative and often too shallow to function as the operational document for contract execution. The TR needs to transform demand and planning context into practical execution, responsibility, fiscalization, delivery, and payment guidance without inventing facts that are absent from the process.

## What Changes

- Refine the TR editorial recipe so it explicitly positions the TR as the technical-operational document of the contracting process, distinct from DFD, ETP, legal opinion, and contract minuta.
- Add the central rule that the TR must operationalize without inventing: structure execution, responsibilities, flows, alignments, and operational conditions while preserving context-only fact handling.
- Improve section guidance for object, justification, technical specifications, obligations, execution period, estimated value and budget, payment conditions, management and fiscalization, and sanctions.
- Make `ESPECIFICAÇÕES TÉCNICAS` a stronger operational section that explains execution dynamics, future alignments, responsibilities, and conditions of performance when details are missing.
- Make obligations for the contractor and contracting authority more executable, fiscalizable, and compatible with real contract operation, avoiding generic bullets and avoiding minuta-style legal clauses.
- Strengthen management and fiscalization guidance so the generated TR describes monitoring, records, communication of failures, conformity checks, acceptance, and evidence of execution.
- Expand type-specific operational guidance for artistic presentations, IT/software, consulting/advisory, goods supply, equipment rental, events, works/engineering, and general services.
- Preserve anti-hallucination rules for technical riders, duration, quantities, deadlines, payment terms, sanctions, percentages, SLA, price research, supplier credentials, legal conclusions, and facts not present in context.
- Add prompt/recipe tests that verify TR role separation, operational depth, type adaptation, and conservative handling of missing data.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: the `tr` recipe must generate operational, executable, fiscalizable, type-aware Terms of Reference that structure execution and responsibilities without becoming ETP, legal opinion, contract minuta, or generic checklist.

## Impact

- Affects TR recipe assets in `apps/api/src/modules/documents/recipes`.
- May affect TR prompt assembly safeguards in `apps/api/src/modules/documents/documents.shared.ts`.
- May affect focused document-generation recipe tests in `apps/api/src/modules/documents/document-generation-recipes.test.ts`.
- Does not change public APIs, document lifecycle, database schema, frontend behavior, provider configuration, or existing stored documents.

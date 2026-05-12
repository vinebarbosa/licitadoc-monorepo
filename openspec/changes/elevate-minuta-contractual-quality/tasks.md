## 1. Minuta Editorial Recipe

- [x] 1.1 Update `apps/api/src/modules/documents/recipes/minuta.instructions.md` to state the Minuta role: formalize the TR operation as a contractual bond.
- [x] 1.2 Document the preserved architecture of fixed clauses, semi-fixed clauses, conditional blocks, and contextual contractual passages.
- [x] 1.3 Strengthen fixed-clause rules so fixed clauses remain stable and protected from creative rewriting.
- [x] 1.4 Add guidance for semi-fixed clauses to become contextual, contractual, and operationally coherent without becoming TR text.
- [x] 1.5 Replace dry missing-data wording with natural contractual placeholder and future-definition language.
- [x] 1.6 Preserve and expand anti-hallucination rules for values, fines, percentages, SLA, schedules, quantities, rider, guarantees, legal clauses, obligations, documents, supplier credentials, payment terms, and execution details.
- [x] 1.7 Add conditional contractual modules for events and artistic presentations.
- [x] 1.8 Add conditional contractual modules for software and IT.
- [x] 1.9 Add conditional contractual modules for consulting and advisory services.
- [x] 1.10 Add conditional contractual modules for supply of goods.
- [x] 1.11 Add conditional contractual modules for works and engineering.
- [x] 1.12 Add conditional contractual modules for continuing and general services.

## 2. Minuta Template

- [x] 2.1 Update `apps/api/src/modules/documents/recipes/minuta.template.md` object guidance to be contractual, contextual, and tied to the administrative process without becoming justification.
- [x] 2.2 Rework the execution clause to describe contractual execution dynamics by object type without inventing dates, places, duration, infrastructure, schedule, rider, or quantities.
- [x] 2.3 Improve the payment clause with execution, fiscal documentation, liquidation, ateste, and conservative missing-payment handling.
- [x] 2.4 Improve the term and budget clauses while preserving placeholders when dates or budget allocation are absent.
- [x] 2.5 Rework contractor and contracting authority obligations so they are contractual, executable, fiscalizable, type-aware, and not generic checklist bullets.
- [x] 2.6 Improve fiscalization guidance for monitoring, communication, records, conformity checks, validation, corrective requests, and payment support.
- [x] 2.7 Improve receipt and acceptance guidance for conformity, acceptance, refusal, correction, replacement, or refazimento without inventing rites or deadlines.
- [x] 2.8 Improve penalties and termination wording so the clauses sound contractually mature while remaining conservative.
- [x] 2.9 Preserve existing fixed clause markers and keep fixed clauses stable unless a reviewed wording adjustment is explicitly required.

## 3. Prompt Assembly Safeguards

- [x] 3.1 Review Minuta prompt assembly in `apps/api/src/modules/documents/documents.shared.ts` for final rules that may leave variable clauses too generic.
- [x] 3.2 Add concise final Minuta rules if needed for formalizing TR operation, type-aware conditional modules, fixed clause stability, and contractual contextualization.
- [x] 3.3 Verify type inference supports artistic/event, software/IT, consulting/advisory, goods, works/engineering, and general/continuing services for Minuta prompts.
- [x] 3.4 Preserve existing fixed clause extraction, prompt listing, and sanitizer behavior for generated Minutas.
- [x] 3.5 Preserve cross-document separation rules so Minuta output does not include DFD, ETP, or TR headings.

## 4. Tests

- [x] 4.1 Update repository-managed Minuta recipe tests to assert modular architecture, fixed clause stability, and richer semi-fixed clause guidance.
- [x] 4.2 Add or update prompt tests for Minuta role guidance, formalizing TR operation, contractual language, and no TR/ETP/DFD structure.
- [x] 4.3 Add or update tests for execution, obligations, fiscalization, receipt, payment, penalties, and conservative placeholder behavior.
- [x] 4.4 Cover representative Minuta scenarios: artistic/event, software/IT, consulting/advisory, goods supply, works/engineering, and continuing/general services.
- [x] 4.5 Verify tests reject generic checklist behavior, incompatible conditional modules, fixed clause rewriting, and unsupported factual claims.
- [x] 4.6 Update document creation tests if prompt assembly changes affect generated Minuta metadata, fixed clauses, or sanitizer behavior.

## 5. Validation

- [x] 5.1 Run `openspec validate elevate-minuta-contractual-quality --strict`.
- [x] 5.2 Run focused backend document generation recipe and Minuta prompt tests.
- [x] 5.3 Run API typecheck or the closest existing validation command if prompt-related TypeScript files are changed.

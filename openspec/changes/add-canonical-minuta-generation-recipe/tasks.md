## 1. Recipe Assets

- [x] 1.1 Create `apps/api/src/modules/documents/recipes/minuta.instructions.md` with formal contract language rules, placeholder policy, value safety, immutable `FIXED` clause rules, TR/ETP reuse guidance, and sanitization constraints.
- [x] 1.2 Create `apps/api/src/modules/documents/recipes/minuta.template.md` with the fixed contract-draft header, party identification, canonical clauses, closing, signatures, and witnesses.
- [x] 1.3 Mark immutable legal-standard clauses in `minuta.template.md` as `FIXED`, including Administration prerogatives, amendment and readjustment, qualification conditions, publicity, omitted cases, and forum.
- [x] 1.4 Register `minuta` in the document-generation recipe resolver so it loads repository-managed instructions and template at runtime.

## 2. Prompt Assembly

- [x] 2.1 Update Minuta prompt assembly to use the repository-managed recipe, process data, organization data, department/source metadata, submitted operator instructions, placeholder rules, and fixed-clause preservation rules.
- [x] 2.2 Normalize missing, empty, zero, `0,00`, `0.00`, and `R$ 0,00` prices as unavailable before building the Minuta prompt.
- [x] 2.3 Ensure unavailable price data is represented with a placeholder such as `R$ XX.XXX,XX`, never as a valid zero price or inferred amount.
- [x] 2.4 Add guidance for adapting available TR/ETP context into contractual language without importing their headings or analytical/technical structure.
- [x] 2.5 Add obligation guidance that prioritizes TR-compatible context and falls back to contracting-type blocks for artistic presentation, general services, goods supply, engineering works, equipment leasing, and general events.
- [x] 2.6 Ensure clauses marked as `FIXED` are treated as immutable text whose only allowed change is valid placeholder substitution.

## 3. Sanitization

- [x] 3.1 Extend generated-content sanitization for `minuta` so stored drafts keep only the canonical contract-draft structure.
- [x] 3.2 Strip or cut leaked DFD, ETP, and TR sections such as `DADOS DA SOLICITACAO`, `LEVANTAMENTO DE MERCADO`, `ANALISE DE ALTERNATIVAS`, `TERMO DE REFERENCIA`, `ESTUDO TECNICO PRELIMINAR`, `DFD`, `ETP`, and `TR`.
- [x] 3.3 Preserve required Minuta clauses after sanitization, including party identification, price, obligations, fiscalization, penalties, rescission, fixed legal-standard clauses, forum, signatures, and witnesses.
- [x] 3.4 Remove internal `FIXED` marker comments from persisted output if the provider copies them, without changing the fixed clause body text.

## 4. Validation

- [x] 4.1 Add tests proving the Minuta recipe resolves from repository-managed instruction and template assets.
- [x] 4.2 Add tests proving `minuta.template.md` contains all canonical contract clauses, marks required immutable clauses as `FIXED`, and excludes DFD, ETP, and TR structures.
- [x] 4.3 Add tests proving `minuta.instructions.md` prohibits invented names, CPF/CNPJ, addresses, representatives, dates, values, procedure numbers, budget allocations, execution details, and rewriting of `FIXED` clauses.
- [x] 4.4 Add tests for Minuta generation with missing or zero price, ensuring the prompt and stored draft use a placeholder rather than zero or a fictitious amount.
- [x] 4.5 Add tests for obligation guidance using TR-compatible context and fallback contracting-type blocks.
- [x] 4.6 Add tests proving Minuta sanitization removes leaked DFD, ETP, and TR headings while keeping the canonical contract clauses.
- [x] 4.7 Add tests comparing generated/persisted `FIXED` clause bodies against the template, allowing only valid placeholder substitution and marker-comment removal.

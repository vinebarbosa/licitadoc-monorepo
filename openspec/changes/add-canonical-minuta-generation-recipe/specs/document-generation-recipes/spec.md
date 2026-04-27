## ADDED Requirements

### Requirement: Minuta generation recipe MUST be repository-managed and runtime-resolvable
The system MUST provide a repository-managed recipe for `minuta` generation that the backend can resolve at runtime without requiring callers to submit a raw provider prompt. The recipe MUST include a textual instruction asset and a Markdown template asset.

#### Scenario: Backend resolves the Minuta recipe
- **WHEN** the backend prepares a `minuta` generation request for a stored process
- **THEN** it resolves a repository-managed instruction asset and a repository-managed Markdown template for `minuta` before invoking the generation provider

### Requirement: Minuta Markdown template MUST represent only the canonical contract-draft structure
The system MUST provide a canonical Markdown model for `minuta` that is derived from the approved contract-draft reference document. The template MUST include the contract header, process/procedure placeholders, party identification for `CONTRATANTE` and `CONTRATADA`, and fixed clauses for object, price, execution, payment, term of validity, budget allocation, contracting authority obligations, contractor obligations, fiscalization, receipt and acceptance, penalties, rescission and extinction, Administration prerogatives, amendment and readjustment, qualification conditions, publicity, omitted cases, forum, closing, signatures, and witnesses. The template MUST mark immutable legal-standard clauses as `FIXED` so the model can distinguish clauses whose text must be preserved exactly from clauses whose operational content may be adapted. The template MUST NOT include `DFD`, `ETP`, or `TR` sections.

#### Scenario: Minuta template includes the fixed contract clauses
- **WHEN** the canonical `minuta` template is reviewed or loaded for prompt assembly
- **THEN** it contains party identification for `CONTRATANTE` and `CONTRATADA` and clauses for object, price, execution, payment, validity, budget allocation, obligations, fiscalization, receipt, penalties, rescission, prerogatives, amendment and readjustment, qualification conditions, publicity, omitted cases, forum, signatures, and witnesses

#### Scenario: Minuta template includes price as a mandatory clause
- **WHEN** the canonical `minuta` template is reviewed or loaded for prompt assembly
- **THEN** it contains the price clause even when the process context has no valid contracting value

#### Scenario: Minuta template marks immutable legal-standard clauses as FIXED
- **WHEN** the canonical `minuta` template is reviewed or loaded for prompt assembly
- **THEN** it marks, at minimum, the clauses for Administration prerogatives, amendment and readjustment, qualification conditions, publicity, omitted cases, and forum as `FIXED`

#### Scenario: Minuta template excludes non-contract sections
- **WHEN** the canonical `minuta` template is reviewed or loaded for prompt assembly
- **THEN** it contains only contract-draft clauses and placeholders, and does not include headings or structural blocks for `DADOS DA SOLICITACAO`, `LEVANTAMENTO DE MERCADO`, `ANALISE DE ALTERNATIVAS`, `TERMO DE REFERENCIA`, `ESTUDO TECNICO PRELIMINAR`, `DFD`, `ETP`, or `TR`

### Requirement: Minuta editorial instructions MUST require placeholders and prohibit invented contract data
The system MUST provide Minuta editorial instructions that require the model to use only information present in the supplied context. The instructions MUST prohibit inventing names, CPF, CNPJ, addresses, representatives, dates, procedure numbers, process numbers, budget allocations, monetary values, payment details, or execution details that do not appear in the context. The instructions MUST require placeholders such as `XXX/2026`, `R$ XX.XXX,XX`, `XX de XXXXX de 2026`, `[CONTRATADA]`, `[CNPJ DA CONTRATADA]`, `[ENDERECO DA CONTRATADA]`, `[REPRESENTANTE LEGAL]`, and `[CPF DO REPRESENTANTE]` when information is unavailable.

#### Scenario: Minuta instructions handle missing contract data with placeholders
- **WHEN** the Minuta instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to use placeholders for absent party, identifier, address, representative, date, procedure, process, value, and budget-allocation data instead of fabricating those fields

#### Scenario: Minuta instructions handle unavailable prices
- **WHEN** the Minuta instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to treat missing prices and `R$ 0,00` as unavailable information and to use a price placeholder instead of presenting zero or an inferred amount as the contracting price

#### Scenario: Minuta instructions require formal contract language
- **WHEN** the Minuta instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to use formal legal language, numbered clauses, `CONTRATANTE`, `CONTRATADA`, `fica estabelecido`, `obriga-se a`, and references to `Lei n. 14.133/2021` when legally appropriate

### Requirement: Minuta editorial instructions MUST enforce immutable FIXED clauses
The system MUST provide Minuta editorial instructions that require every clause marked as `FIXED` in `minuta.template.md` to be copied verbatim from the template. The instructions MUST prohibit rewriting, summarizing, simplifying, reorganizing, adapting legal terminology, or otherwise changing the text of `FIXED` clauses, except for substituting placeholders with valid context values.

#### Scenario: Minuta instructions preserve FIXED clause text
- **WHEN** the Minuta instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to preserve the exact text of each `FIXED` clause and only replace placeholders when valid source data exists

#### Scenario: Minuta instructions prohibit adapting FIXED clauses
- **WHEN** the Minuta instruction asset is reviewed or loaded for prompt assembly
- **THEN** it prohibits rewriting, summarizing, simplifying, changing legal terms, or adapting language inside `FIXED` clauses

### Requirement: Minuta editorial instructions MUST derive obligations from TR-compatible guidance
The system MUST provide Minuta editorial instructions that derive the contracting authority and contractor obligation clauses primarily from available TR content or TR-compatible process context. If no TR content is available, the instructions MUST guide the model to use contracting-type obligation blocks equivalent to the TR recipe for `apresentacao_artistica`, `prestacao_servicos_gerais`, `fornecimento_bens`, `obra_engenharia`, `locacao_equipamentos`, and `eventos_gerais`.

#### Scenario: Minuta instructions prioritize TR obligations
- **WHEN** the Minuta instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to adapt available TR obligations into contractual language and avoid copying TR headings or explanatory technical sections

#### Scenario: Minuta instructions provide fallback obligation blocks by contracting type
- **WHEN** the Minuta instruction asset is reviewed or loaded for prompt assembly
- **THEN** it includes or references structured obligation guidance for artistic presentation, general services, goods supply, engineering works, equipment leasing, and general events

#### Scenario: Minuta instructions constrain obligation adaptation
- **WHEN** the Minuta instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to select the most compatible contracting type, adapt only compatible obligations, avoid mixing unrelated obligation blocks, and avoid adding disproportionate duties not supported by the context

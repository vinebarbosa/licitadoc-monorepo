## ADDED Requirements

### Requirement: TR generation recipe MUST be repository-managed and runtime-resolvable
The system MUST provide a repository-managed recipe for `tr` generation that the backend can resolve at runtime without requiring callers to submit a raw provider prompt. The recipe MUST include a textual instruction asset and a Markdown template asset.

#### Scenario: Backend resolves the TR recipe
- **WHEN** the backend prepares a `tr` generation request for a stored process
- **THEN** it resolves a repository-managed instruction asset and a repository-managed Markdown template for `tr` before invoking the generation provider

### Requirement: TR Markdown template MUST represent only the canonical TR structure
The system MUST provide a canonical Markdown model for `tr` that is derived only from the `TERMO DE REFERENCIA` portion of the approved reference document. The template MUST include the TR sections for object, contracting justification, technical service specifications, contractor obligations, contracting authority obligations, execution term, estimated value and budget allocation, payment conditions, contract management and fiscalization, administrative sanctions, and signature block. The template MUST NOT include `DFD` or `ETP` sections.

#### Scenario: TR template includes operational and contractual sections
- **WHEN** the canonical `tr` template is reviewed or loaded for prompt assembly
- **THEN** it contains headings for obligations of the contractor, obligations of the contracting authority, execution term, payment conditions, management and fiscalization, and administrative sanctions

#### Scenario: TR template includes the value-estimate and budget section
- **WHEN** the canonical `tr` template is reviewed or loaded for prompt assembly
- **THEN** it contains the `VALOR ESTIMADO E DOTACAO ORCAMENTARIA` heading even when the process context has no available estimate

#### Scenario: TR template excludes non-TR sections
- **WHEN** the canonical `tr` template is reviewed or loaded for prompt assembly
- **THEN** it contains only TR headings and placeholders, and does not include headings or structural blocks for `DFD` or analytical `ETP` sections

### Requirement: TR editorial instructions MUST constrain technical details, values, and obligation generation
The system MUST provide TR editorial instructions that require the model to use only information present in the supplied context. The instructions MUST prohibit inventing technical specifications, exact dates, locations, durations, infrastructure, payment details, sanctions, or monetary values that do not appear in the context. The instructions MUST require conservative language such as `nao informado`, `nao consta no contexto`, `a ser definido posteriormente`, and `conforme definicao da Administracao` when information is unavailable.

#### Scenario: TR instructions handle unavailable estimates
- **WHEN** the TR instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to treat missing estimates and `R$ 0,00` as unavailable information and to indicate that value will be determined later by market research or a proper pricing step

#### Scenario: TR instructions include obligation blocks by contracting type
- **WHEN** the TR instruction asset is reviewed or loaded for prompt assembly
- **THEN** it contains a section named `Obrigacoes por tipo de contratacao` with structured blocks for `apresentacao_artistica`, `prestacao_servicos_gerais`, `fornecimento_bens`, `obra_engenharia`, `locacao_equipamentos`, and `eventos_gerais`

#### Scenario: TR instructions guide obligation block usage
- **WHEN** the TR instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to derive obligations primarily from the matching contracting-type block, adapt items to the specific context, avoid incompatible obligations, and avoid mixing blocks unless the context requires it

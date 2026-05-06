## ADDED Requirements

### Requirement: ETP generation recipe MUST be repository-managed and runtime-resolvable
The system MUST provide a repository-managed recipe for `etp` generation that the backend can resolve at runtime without requiring callers to submit a raw provider prompt. The recipe MUST include a textual instruction asset and a Markdown template asset.

#### Scenario: Backend resolves the ETP recipe
- **WHEN** the backend prepares an `etp` generation request for a stored process
- **THEN** it resolves a repository-managed instruction asset and a repository-managed Markdown template for `etp` before invoking the generation provider

### Requirement: ETP Markdown template MUST represent only the canonical ETP structure
The system MUST provide a canonical Markdown model for `etp` that is derived only from the `ESTUDO TECNICO PRELIMINAR (ETP)` portion of the approved reference document. The template MUST include the ETP sections for introduction, contracting need, solution description and requirements, market survey and alternatives, contracting value estimate, budgetary adequacy, sustainability and impacts, contract management and fiscalization, conclusion and recommendation, and signature block. The template MUST NOT include `DFD` or `TR` sections.

#### Scenario: ETP template includes the value-estimate section
- **WHEN** the canonical `etp` template is reviewed or loaded for prompt assembly
- **THEN** it contains the `ESTIMATIVA DO VALOR DA CONTRATACAO` heading even when the process context has no available estimate

#### Scenario: ETP template excludes non-ETP sections
- **WHEN** the canonical `etp` template is reviewed or loaded for prompt assembly
- **THEN** it contains only ETP headings and placeholders, and does not include headings or structural blocks for `DFD` or `TR`

### Requirement: ETP editorial instructions MUST prohibit inferred estimates and simulated market research
The system MUST provide ETP editorial instructions that require the model to use only information present in the supplied context. The instructions MUST prohibit inventing, estimating, simulating, or inferring monetary values and MUST prohibit claiming that market research was performed when the supplied context does not contain that research.

#### Scenario: ETP instructions handle unavailable estimates
- **WHEN** the ETP instruction asset is reviewed or loaded for prompt assembly
- **THEN** it instructs the model to treat missing estimates and `R$ 0,00` as unavailable information and to use conservative language such as `nao informado`, `nao consta no contexto`, and `sera objeto de apuracao posterior`

#### Scenario: ETP instructions allow contextual reuse without structural leakage
- **WHEN** the ETP instruction asset is reviewed or loaded for prompt assembly
- **THEN** it permits reuse or adaptation of overlapping process/DFD context for consistency while requiring the final document to keep only the canonical ETP structure

## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored process data, the requested document type, any optional operator instructions submitted with the request, and any repository-managed recipe required by that document type. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, the system MUST assemble the generation input from the repository-managed DFD instruction asset, the repository-managed DFD Markdown template, resolved department and source metadata when available, the process data, the organization data, and the submitted instructions before invoking the provider. For `etp`, the system MUST assemble the generation input from the repository-managed ETP instruction asset, the repository-managed ETP Markdown template, resolved department and source metadata when available, normalized estimate availability, the process data, the organization data, and the submitted instructions before invoking the provider. For `tr`, the system MUST assemble the generation input from the repository-managed TR instruction asset, the repository-managed TR Markdown template, resolved department and source metadata when available, normalized estimate availability, contracting-type obligation guidance, the process data, the organization data, and the submitted instructions before invoking the provider. For `minuta`, the system MUST assemble the generation input from the repository-managed Minuta instruction asset, the repository-managed Minuta Markdown template, resolved department and source metadata when available, normalized price availability, process and organization data, TR/ETP-compatible context when available, contracting-type obligation guidance, placeholder rules, fixed-clause preservation rules, and the submitted instructions before invoking the provider.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed DFD recipe, resolved department and source metadata when available, and the submitted instructions before invoking the provider

#### Scenario: Generation uses canonical ETP recipe and safe estimate context
- **WHEN** an authorized actor requests an ETP draft for a stored process whose source context has no estimate or only `R$ 0,00`
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed ETP recipe, resolved department and source metadata when available, submitted instructions, and an explicit indication that the estimate is unavailable

#### Scenario: Generation uses canonical TR recipe and obligation guidance
- **WHEN** an authorized actor requests a TR draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed TR recipe, resolved department and source metadata when available, normalized estimate availability, contracting-type obligation guidance, and the submitted instructions before invoking the provider

#### Scenario: Generation uses canonical Minuta recipe and placeholder rules
- **WHEN** an authorized actor requests a Minuta draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed Minuta recipe, resolved department and source metadata when available, normalized price availability, placeholder rules, fixed-clause preservation rules, TR/ETP-compatible context when available, contracting-type obligation guidance, and the submitted instructions before invoking the provider

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request

## ADDED Requirements

### Requirement: Minuta generation MUST preserve canonical contract-only structure and placeholder safety
The system MUST constrain generated `minuta` drafts to the canonical contract-draft structure and MUST NOT persist sections that belong to `dfd`, `etp`, or `tr`. The stored draft content for `minuta` MUST include party identification and all canonical contract clauses, including the price clause. When party data, identifiers, addresses, representatives, dates, process numbers, procedure numbers, budget allocations, or prices are missing from the context, the stored draft MUST use placeholders instead of invented data. Clauses marked as `FIXED` in the template MUST retain their canonical body text exactly, except for valid placeholder substitutions and removal of internal template marker comments.

#### Scenario: Generated Minuta omits DFD, ETP, and TR sections
- **WHEN** the provider returns content for a valid `minuta` generation request
- **THEN** the stored draft content follows the canonical contract-draft structure and does not include `DADOS DA SOLICITACAO`, `LEVANTAMENTO DE MERCADO`, `ANALISE DE ALTERNATIVAS`, `TERMO DE REFERENCIA`, `ESTUDO TECNICO PRELIMINAR`, `DFD`, `ETP`, or `TR` headings or body sections

#### Scenario: Generated Minuta keeps all canonical clauses
- **WHEN** the provider returns content for a valid `minuta` generation request
- **THEN** the stored draft content includes party identification for `CONTRATANTE` and `CONTRATADA` and clauses for object, price, execution, payment, validity, budget allocation, obligations, fiscalization, receipt, penalties, rescission, prerogatives, amendment and readjustment, qualification conditions, publicity, omitted cases, forum, signatures, and witnesses

#### Scenario: Missing or zero price uses a placeholder
- **WHEN** the provider generates a `minuta` draft for a process whose source context has no price or only `R$ 0,00`, `0`, `0,00`, or `0.00`
- **THEN** the stored draft keeps the price clause and uses a placeholder such as `R$ XX.XXX,XX` instead of presenting zero, inferring a value, or simulating market pricing

#### Scenario: Missing party identifiers use placeholders
- **WHEN** the provider generates a `minuta` draft for a process without contractor name, CPF, CNPJ, address, representative, or representative CPF in the supplied context
- **THEN** the stored draft uses placeholders for those fields and does not invent party-identification data

#### Scenario: Generated Minuta preserves FIXED clause text
- **WHEN** the provider generates a `minuta` draft from a template containing clauses marked as `FIXED`
- **THEN** the stored draft preserves the body text of each `FIXED` clause exactly as defined in the template, except for valid placeholder substitutions and removal of template marker comments

### Requirement: Minuta generation MUST protect immutable legal-standard clauses
The system MUST treat every `FIXED` clause in `minuta.template.md` as immutable contract language. Generation and post-processing MUST NOT rewrite, summarize, simplify, reorder, adapt legal terminology, or remove clauses marked as `FIXED`. The immutable set MUST include, at minimum, Administration prerogatives, amendment and readjustment, qualification conditions, publicity, omitted cases, and forum.

#### Scenario: FIXED clauses cannot be rewritten by generation
- **WHEN** the provider returns a `minuta` draft where a `FIXED` clause was rephrased, summarized, simplified, or had legal terms changed
- **THEN** the system rejects, corrects, or otherwise prevents that modified clause text from being persisted as the canonical generated draft

#### Scenario: FIXED clauses allow only placeholder substitution
- **WHEN** a `FIXED` clause contains placeholders and valid values exist in the supplied context
- **THEN** the generated draft may replace those placeholders while preserving all remaining clause text exactly

### Requirement: Minuta generation MUST adapt obligations and operational content from TR-compatible context
The system MUST guide generated `minuta` obligations and operational clauses from available TR content or TR-compatible context. When TR context is unavailable, the system MUST provide contracting-type obligation guidance so the model can select the block most compatible with the object, adapt compatible obligations to contractual language, and avoid importing technical headings or analytical sections from TR, ETP, or DFD.

#### Scenario: TR-compatible artistic context drives Minuta obligations
- **WHEN** an authorized actor requests a `minuta` draft for an object involving artistic presentation and the context includes TR-compatible execution and obligation details
- **THEN** the generation prompt guides the provider to adapt those details into contract clauses for contractor and contracting authority obligations without copying TR headings or adding unsupported duties

#### Scenario: Minuta falls back to contracting-type obligation guidance
- **WHEN** an authorized actor requests a `minuta` draft and no TR content is available
- **THEN** the generation prompt includes contracting-type obligation guidance equivalent to the TR recipe and instructs the provider to use the most compatible block conservatively

#### Scenario: Minuta reuses ETP or TR context without structural leakage
- **WHEN** the provider generates a `minuta` draft using object, justification, execution, or obligation context from ETP or TR
- **THEN** the stored draft adapts that context to contract language and does not preserve analytical ETP sections or technical TR section headings

## ADDED Requirements

### Requirement: Generated document recipes MUST use accented formal Portuguese
Repository-managed recipes for generated procurement documents MUST use correctly accented Brazilian Portuguese in all formal document-facing instruction text, template headings, administrative labels, canonical section names, and reusable prose snippets. The system MUST apply this requirement to `dfd`, `etp`, `tr`, and `minuta` recipe assets.

#### Scenario: Recipe assets present review-ready Portuguese
- **WHEN** the backend loads a repository-managed recipe asset for `dfd`, `etp`, `tr`, or `minuta`
- **THEN** formal document-facing text in that asset uses accented Brazilian Portuguese for headings, labels, and prose such as "geração", "contratação", "solicitação", "orçamentária", "responsável", "administração", and "não"
- **AND** the recipe preserves existing document structure and anti-hallucination constraints

### Requirement: Prompt assembly MUST avoid unaccented Portuguese in document-facing text
The backend MUST assemble generation prompts with accented Brazilian Portuguese for formal document-facing section labels, structured context labels, final mandatory rules, and fallback instructions. The system MUST NOT prime the generation provider with unaccented Portuguese for labels or prose that may be copied into the generated draft.

#### Scenario: Structured prompt labels use accented Portuguese
- **WHEN** the backend prepares a generation prompt for a supported generated document type
- **THEN** prompt labels and rules intended to guide final document prose use accented forms such as "Modelo Markdown canônico", "Contexto estruturado do processo", "Número da solicitação", "Data de emissão", "Organização", "Instruções adicionais", and "Regras finais obrigatórias"
- **AND** the prompt still includes the same factual process, organization, department, source metadata, and operator instruction values as before

#### Scenario: Sanitizer fallback snippets use accented Portuguese
- **WHEN** sanitization appends a missing required fallback section or replaces an invalid zero-value snippet
- **THEN** the appended heading and prose use accented Brazilian Portuguese
- **AND** the sanitizer still prevents unsupported values, nonmatching sections, and cross-document structural leakage as before

### Requirement: Accent-insensitive matching MUST remain internal-only
The system MUST keep accent-insensitive normalization for internal matching, parsing, heading detection, and sanitization, but MUST NOT use those normalized comparison strings as generated document text.

#### Scenario: Internal matching tolerates heading accent variation
- **WHEN** provider output uses either accented or unaccented variants of known headings during sanitization
- **THEN** the system still detects start, stop, and required-section headings correctly
- **AND** stored or appended formal text remains the original provider text or backend-authored accented text, not a diacritic-stripped comparison value

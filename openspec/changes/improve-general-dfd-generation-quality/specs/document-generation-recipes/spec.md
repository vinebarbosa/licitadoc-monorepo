## ADDED Requirements

### Requirement: DFD recipe MUST generate subject-aware DFD content
The `dfd` generation recipe MUST guide the model to produce a robust, subject-aware DFD for any process object while preserving the canonical DFD structure. The recipe MUST treat approved reference documents as quality benchmarks, not as reusable theme-specific content.

#### Scenario: Cultural event DFD uses event-appropriate reasoning
- **WHEN** the backend prepares a `dfd` generation request for a process about a cultural event or artistic service
- **THEN** the prompt instructs the model to address cultural relevance, public access, audience, schedule or event context when present, economic/social impact when supported, and event-compatible requirements without requiring unrelated goods, works, or technology language

#### Scenario: Administrative service DFD uses service-appropriate reasoning
- **WHEN** the backend prepares a `dfd` generation request for a process about administrative, technical, advisory, or support services
- **THEN** the prompt instructs the model to address operational need, specialized expertise, continuity, compliance, confidentiality or support obligations when applicable, and service-compatible requirements without reusing event-specific language

#### Scenario: Goods acquisition DFD uses acquisition-appropriate reasoning
- **WHEN** the backend prepares a `dfd` generation request for a process about acquiring goods or materials
- **THEN** the prompt instructs the model to address quantity, specification, delivery, warranty, replacement, stock, or suitability concerns when present and to avoid service-only requirements that do not fit the object

### Requirement: DFD recipe MUST prevent unsupported factual claims
The `dfd` generation recipe MUST instruct the model to use only process context, organization context, department context, source metadata, and operator instructions as factual sources. The recipe MUST prohibit invented facts about values, legal grounds, dates, duration, quantity, location, contractor attributes, exclusivity, technical credentials, or market compatibility.

#### Scenario: Missing or zero value does not produce market-compatibility claim
- **WHEN** the DFD context has no reliable estimated value or has an extracted value of `0,00`
- **THEN** the prompt instructs the model not to state that the value is compatible with market prices or already validated
- **AND** the prompt allows only cautious language that the estimate, if applicable, must be instructed or assessed in the proper process phase

#### Scenario: Missing execution details are not invented
- **WHEN** the DFD context does not include execution duration, specific location, quantity, or schedule details
- **THEN** the prompt instructs the model not to invent those details
- **AND** the generated DFD must record the absence conservatively when the information is necessary for review

### Requirement: DFD prompt context MUST prefer review-ready official labels
The DFD prompt assembly MUST provide the model with the clearest official labels available for organization, department, budget unit, responsible person, and responsible role. When both canonical stored data and abbreviated source data are available, canonical stored labels MUST be preferred for final document presentation while source values remain available as supporting context.

#### Scenario: Canonical department name is preferred over source abbreviation
- **WHEN** a process has a source budget unit name abbreviation and a linked department with a fuller canonical name
- **THEN** the DFD prompt provides enough context for the model to use the fuller canonical department name in the generated DFD

#### Scenario: Markdown field values are formal document text
- **WHEN** the model is instructed to render solicitation data in the DFD
- **THEN** the recipe instructs that field values are plain formal document text and must not be wrapped in Markdown inline code ticks

### Requirement: DFD essential requirements MUST match the object nature
The `dfd` recipe MUST instruct the model to select essential requirements that are compatible with the process object and to avoid generic or irrelevant requirement bullets. Requirements MUST be concise, reviewable, and grounded in the provided context or in direct administrative implications of the object.

#### Scenario: Requirements adapt to the process category
- **WHEN** the process object indicates a service, good, work, technology item, health/education need, or event-related service
- **THEN** the DFD prompt instructs the model to choose requirement axes that fit that category and the available facts
- **AND** the prompt instructs the model not to copy category examples that do not apply

#### Scenario: Requirements avoid unsupported specificity
- **WHEN** a specific certification, brand, legal basis, duration, quantity, or technical standard is not present in context
- **THEN** the DFD recipe instructs the model not to include that unsupported specificity as an essential requirement

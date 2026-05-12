## ADDED Requirements

### Requirement: ETP recipe MUST generate technically complete subject-aware ETP content
The `etp` generation recipe MUST guide the model to produce a robust, technically complete, subject-aware ETP for the process object while preserving the canonical ETP structure. The recipe MUST treat reference documents as quality benchmarks, not as reusable source content.

#### Scenario: Artistic service ETP uses event-appropriate planning analysis
- **WHEN** the backend prepares an `etp` generation request for a process about an artistic presentation, musical attraction, cultural event, or popular festivity
- **THEN** the prompt instructs the model to address cultural relevance, public-interest need, event compatibility, audience impact, schedule or event context when present, execution risks, and event-compatible management/fiscalization concerns
- **AND** the prompt does not require unrelated goods, works, technology, or supply-chain language

#### Scenario: Non-event ETP adapts to the object category
- **WHEN** the backend prepares an `etp` generation request for goods, general services, equipment rental, works, technology, health, education, or another non-event object
- **THEN** the prompt instructs the model to adapt requirements, alternatives, risks, impacts, and fiscalization criteria to the actual object category and available facts
- **AND** the prompt instructs the model not to copy event-specific examples that do not apply

### Requirement: ETP recipe MUST deepen planning analysis without inventing facts
The `etp` recipe MUST require substantive analysis of need, risk of non-contracting, solution requirements, alternatives, price-research methodology, budget compatibility, sustainability/impacts, management/fiscalization, and recommendation. The recipe MUST prohibit invented facts about values, completed market research, legal grounds, dates, duration, quantity, location, contractor attributes, exclusivity, technical credentials, or budget availability.

#### Scenario: Missing market research is described as future methodology
- **WHEN** the ETP context does not include completed market research, prior contracts, supplier quotations, official price panels, or values
- **THEN** the prompt instructs the model not to state that those consultations were performed
- **AND** the prompt allows only conservative language that the price survey or market research must be performed in the appropriate subsequent phase

#### Scenario: Missing or zero estimate remains unavailable
- **WHEN** the ETP context has no reliable estimated value or has an extracted value of `0`, `0,00`, `0.00`, or `R$ 0,00`
- **THEN** the prompt instructs the model to keep the estimate section present and state that the value is not informed or will be calculated later
- **AND** the prompt instructs the model not to simulate, round, project, or invent a price

### Requirement: ETP prompt context MUST expose an inferred analysis profile
The ETP prompt assembly MUST provide the generation provider with an inferred broad analysis profile derived from process object, item description, process justification, and process type. The prompt MUST state that the profile is only editorial guidance and not a factual source for adding unsupported details.

#### Scenario: Artistic presentation profile is inferred from process context
- **WHEN** a process object or item description contains terms such as artistic presentation, musical attraction, show, band, artist, carnival, or popular festivity
- **THEN** the ETP prompt includes an inferred profile for artistic presentation analysis
- **AND** final instructions require the model to use that profile only to adjust technical emphasis while preserving the supplied context as the factual source

#### Scenario: Generic service profile is used as fallback
- **WHEN** the process context does not match a more specific broad category
- **THEN** the ETP prompt includes a general service profile
- **AND** the recipe still requires object-aware analysis based on the available process context

### Requirement: ETP management, fiscalization, and risk guidance MUST be explicit
The `etp` recipe MUST instruct the model to include reviewable management, fiscalization, and risk/providence guidance suitable for the object. This guidance MUST cover execution monitoring, conformity checks, records, occurrence handling, receipt or ateste when applicable, and conditions for process continuation when estimate or budget data are missing.

#### Scenario: ETP includes management and risk considerations
- **WHEN** the backend prepares any `etp` generation request
- **THEN** the prompt instructs the model to address how execution should be monitored and what risks or pending conditions must be managed
- **AND** the prompt keeps those statements limited to the context and direct administrative implications of the object

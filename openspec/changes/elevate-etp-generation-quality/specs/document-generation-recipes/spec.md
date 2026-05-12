## ADDED Requirements

### Requirement: ETP recipe MUST produce institutional narrative prose
The `etp` generation recipe MUST guide the model to produce a fluent, continuous, institutional administrative document rather than a checklist, prompt response, or generic template fill. The recipe MUST require logical paragraph transitions, developed administrative reasoning, and clear linkage among need, solution, alternatives, risks, benefits, and recommendation.

#### Scenario: ETP avoids checklist-like output
- **WHEN** the backend prepares an `etp` generation request
- **THEN** the prompt instructs the model to write primarily in developed institutional paragraphs
- **AND** the prompt allows lists only when they improve formal administrative readability, such as risk measures or fiscalization controls
- **AND** the prompt prohibits reproducing template guidance as mechanical bullet answers

#### Scenario: ETP uses technical administrative reasoning
- **WHEN** the generated ETP discusses need, solution, alternatives, fiscalization, risks, or conclusion
- **THEN** the prompt requires reasoning that explains how each analysis point relates to the process object and the public interest
- **AND** the prompt discourages empty phrases, exaggerated adjectives, marketing tone, and repeated generic wording

### Requirement: ETP canonical structure MUST include dedicated risks and expected benefits sections
The canonical `etp` Markdown template MUST include dedicated sections for risks of the contracting and expected benefits. These sections MUST appear before conclusion and closing, and the existing estimate and budget sections MUST remain present.

#### Scenario: ETP template includes risk section
- **WHEN** the canonical `etp` template is reviewed or loaded for prompt assembly
- **THEN** it includes a `RISCOS DA CONTRATAÇÃO` section with guidance for operational, logistical, technical, delay, availability, execution, security, climatic when applicable, and mitigation considerations
- **AND** this section does not authorize the model to invent specific incidents or facts not present in context

#### Scenario: ETP template includes expected benefits section
- **WHEN** the canonical `etp` template is reviewed or loaded for prompt assembly
- **THEN** it includes a `BENEFÍCIOS ESPERADOS` section with guidance for cultural, social, economic, institutional, service-continuity, public-access, or object-compatible benefits
- **AND** it instructs the model not to quantify benefits when the context has no supporting data

### Requirement: ETP missing-data language MUST remain natural and conservative
The `etp` recipe MUST prevent invented facts while avoiding repetitive, robotic absence statements. When data is missing, the recipe MUST instruct the model to use natural institutional phrasing and to explain methodology, criteria, procedures, and future apuração where appropriate.

#### Scenario: Missing estimate produces substantive methodology
- **WHEN** the ETP context has no reliable estimated value or has an extracted zero-like value
- **THEN** the estimate section remains present
- **AND** the prompt instructs the model to discuss future price-research methodology, possible sources, comparison criteria, and procedural care without inventing values or claiming research was already completed

#### Scenario: Missing market research remains future work
- **WHEN** the ETP context does not contain completed market research
- **THEN** the prompt prohibits stating that consultations, supplier quotations, prior-contract comparisons, official-panel research, or regional benchmarks have already been performed
- **AND** the prompt instructs the model to frame those items as planned methodology or complementary administrative apuração

#### Scenario: Absence wording avoids robotic repetition
- **WHEN** required data is absent from context
- **THEN** the prompt instructs the model to prefer phrasing such as "a definição ocorrerá em etapa posterior", "dependerá de levantamento específico", "será objeto de apuração complementar", or "deverá ser verificado pela Administração"
- **AND** the prompt discourages repeated use of "não informado" or "não consta no contexto" as the dominant wording pattern

### Requirement: ETP recipe MUST deepen section-specific technical analysis
The `etp` recipe MUST require stronger section-level guidance for introduction, need, solution/requisitos, market methodology, alternatives, chosen-solution justification, estimate, budget adequacy, sustainability/impacts, management/fiscalization, risks, benefits, and conclusion. The guidance MUST remain object-aware and context-faithful.

#### Scenario: Solution description explains execution logic
- **WHEN** the ETP describes the proposed solution
- **THEN** the prompt instructs the model to explain how the solution can satisfy the need through execution form, operational requirements, technical requirements, logistics, structure, quality control, and safety considerations applicable to the inferred analysis profile
- **AND** the prompt prohibits adding unsupported duration, location, technical rider, equipment, staffing, or contractor-specific claims

#### Scenario: Alternatives analysis is comparative
- **WHEN** the ETP analyzes alternatives
- **THEN** the prompt instructs the model to compare advantages, limitations, risks, operational consequences, administrative impacts, and public-interest implications
- **AND** the prompt prohibits framing the analysis as a merely forced justification of the preferred solution

#### Scenario: Management and fiscalization are robust
- **WHEN** the ETP describes management and fiscalization
- **THEN** the prompt instructs the model to address responsible monitoring, execution follow-up, technical verification, quality control, schedule or milestone control when applicable, occurrence records, failure communication, contractual conformity, acceptance or ateste, reports, and risk mitigation
- **AND** the prompt keeps sanctions or penalties generic unless specific rules are present in the process context

### Requirement: ETP prompt MUST protect contextual consistency
The ETP prompt assembly MUST remind the model to preserve the process object, municipality, organization, department, item description, estimate state, and inferred analysis profile. It MUST explicitly prohibit mixing information from other templates, examples, previous documents, or unrelated generated content.

#### Scenario: Prompt includes context consistency guardrails
- **WHEN** the backend builds an `etp` generation prompt
- **THEN** final rules instruct the model to verify consistency between the process context and generated references to object, organization, municipality, responsible area, item, estimate, and profile
- **AND** final rules prohibit citing a different artist, supplier, órgão, municipality, object, source document type, or contracting category than the context supports

#### Scenario: Legal and TCU guidance remains planning-oriented
- **WHEN** the ETP references Law 14.133/2021 or TCU good practices
- **THEN** the prompt instructs the model to use them as generic planning-quality orientation
- **AND** the prompt prohibits inventing article numbers, acórdãos, binding legal conclusions, or specific legal grounds not present in context or recipe guidance

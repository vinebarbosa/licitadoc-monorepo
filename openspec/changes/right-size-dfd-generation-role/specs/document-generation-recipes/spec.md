## ADDED Requirements

### Requirement: DFD recipe MUST preserve initial demand-formalization role
The `dfd` generation recipe MUST guide the model to produce a concise, objective, administrative document that formalizes the demand, identifies the requesting context, describes the object, records an initial justification, and lists essential minimum requirements. The recipe MUST distinguish DFD from ETP, TR, minuta, legal opinion, and feasibility study.

#### Scenario: DFD prompt defines DFD role
- **WHEN** the backend prepares a `dfd` generation request
- **THEN** the prompt states that DFD is an initial demand-formalization document
- **AND** it states that DFD must not develop ETP, TR, legal opinion, or feasibility-study analysis

#### Scenario: DFD remains shorter than planning and execution documents
- **WHEN** the DFD recipe guides narrative sections
- **THEN** it instructs context/need, object, and justification sections to remain proportional, usually 1-2 paragraphs each
- **AND** it instructs the model to avoid long documents for simple demands

### Requirement: DFD recipe MUST prohibit ETP and TR content patterns
The `dfd` recipe MUST prohibit content typical of ETP or TR, including market methodology, market study, alternative analysis, sophisticated risk analysis, risk matrix, fiscalization planning, contractual obligations, payment criteria, measurement criteria, SLA, economicity conclusions, vantajosidade conclusions, legal opinions, and detailed execution clauses.

#### Scenario: DFD does not include ETP-style analysis
- **WHEN** a DFD is generated for any process category
- **THEN** the prompt instructs the model not to include market research methodology, alternatives, feasibility analysis, risk matrix, detailed impact study, economicity conclusions, or vantajosidade statements

#### Scenario: DFD does not include TR-style execution clauses
- **WHEN** a DFD is generated for any process category
- **THEN** the prompt instructs the model not to include contractor obligations, contracting-party obligations, payment rules, measurement criteria, acceptance criteria, SLA, sanctions, or detailed fiscalization clauses

### Requirement: DFD sections MUST be objective and proportional
The canonical `dfd` recipe and template MUST keep the existing DFD structure and instruct the model to write each section at the proper depth for initial demand formalization. Requirements MUST be short, objective, and minimum-essential.

#### Scenario: Context and need section is limited to initial motivation
- **WHEN** the DFD template guides `CONTEXTO E NECESSIDADE DA DEMANDA`
- **THEN** it instructs the model to explain institutional context, administrative need, problem to be addressed, and impact of non-attendance
- **AND** it limits the section to 1-2 paragraphs except for unusually complex objects

#### Scenario: Object section avoids execution deep dive
- **WHEN** the DFD template guides `OBJETO DA CONTRATAÇÃO`
- **THEN** it instructs the model to describe the object, expected result, and direct relation to the need
- **AND** it prohibits detailed execution planning, fiscalization, technical study, or TR-style requirements

#### Scenario: Requirements remain minimum and essential
- **WHEN** the DFD template guides `REQUISITOS ESSENCIAIS PARA A CONTRATAÇÃO`
- **THEN** it instructs the model to produce 3-6 short bullets directly tied to the object
- **AND** it prohibits detailed contractual clauses, fiscalization criteria, unsupported certifications, unsupported technical standards, and excessive specificity

### Requirement: DFD recipe MUST preserve conservative fact handling
The DFD recipe MUST continue to use only provided process, organization, department, source metadata, and operator instruction context as factual sources. It MUST prohibit invented values, dates, duration, recognition, experience, exclusivity, supplier, budget allocation, market research, and specific legal grounds.

#### Scenario: Missing value is handled simply
- **WHEN** DFD context lacks an estimated value or has a zero-like value
- **THEN** the prompt instructs the model not to state market compatibility, economicity, or validated price
- **AND** it allows only simple wording that the value will be apured during process instruction or a later stage

#### Scenario: Missing execution details are not invented
- **WHEN** DFD context lacks duration, location, quantity, supplier attributes, recognition, exclusivity, or budget data
- **THEN** the prompt instructs the model not to invent those facts
- **AND** it allows conservative phrasing that the competent unit must confirm details later

### Requirement: DFD prompt tests MUST cover representative object categories
The document generation recipe tests MUST cover DFD prompt guidance across representative object categories so role separation does not regress toward ETP or TR behavior.

#### Scenario: Representative DFD scenarios remain proportional
- **WHEN** tests build DFD prompts for artistic presentation, HR advisory, office supplies, equipment acquisition, technology service, and works/reform contexts
- **THEN** each prompt includes DFD role and size guidance
- **AND** each prompt prohibits ETP/TR-style analysis and unsupported factual claims

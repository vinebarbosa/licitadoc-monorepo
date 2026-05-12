## ADDED Requirements

### Requirement: TR recipe MUST preserve technical-operational role
The `tr` generation recipe MUST guide the model to produce a Termo de Referência as the technical-operational document of the contracting process. The TR MUST transform the need and planning context into practical rules for execution, responsibilities, delivery, payment support, management, and fiscalization, while remaining distinct from DFD, ETP, legal opinion, contract minuta, and generic checklist.

#### Scenario: TR prompt defines operational role
- **WHEN** the backend prepares a `tr` generation request
- **THEN** the prompt states that the TR operationalizes the contracting object
- **AND** it states that the TR focuses on how the object will be executed, monitored, fiscalized, and delivered
- **AND** it states that the TR must not become ETP, legal opinion, contract minuta, or checklist

#### Scenario: TR does not repeat ETP analysis
- **WHEN** a TR is generated for any process category
- **THEN** the prompt prohibits ETP-style market study, alternative analysis, viability study, strategic planning narrative, risk matrix, or justification of chosen solution
- **AND** it keeps the justification objective and focused on practical contracting need and operational impact

### Requirement: TR recipe MUST operationalize without inventing
The `tr` recipe MUST instruct the model to structure execution, responsibilities, operational flow, alignments, and conditions conservatively when details are absent. It MUST prohibit invented technical, commercial, legal, operational, or supplier facts.

#### Scenario: Missing operational details are structured conservatively
- **WHEN** TR context lacks infrastructure, logistics, cronograma, support, location, duration, team, technical rider, materials, quantity, or execution conditions
- **THEN** the prompt instructs the model not to invent those details
- **AND** it instructs the model to describe that the definitions must be aligned, confirmed, or consolidated before execution or in the appropriate subsequent instrument
- **AND** it avoids reducing the section to only "não informado", "a definir", or "quando aplicável"

#### Scenario: Anti-hallucination protections remain active
- **WHEN** TR context lacks specific facts
- **THEN** the prompt prohibits invented technical rider, duration, quantities, deadlines, payment terms, sanctions, percentages, SLA, price research, notable specialization, documentary regularity, cronogramas, supplier credentials, budget allocation, legal grounds, and execution details

### Requirement: TR technical specifications MUST be operationally robust
The canonical `tr` recipe and template MUST make `ESPECIFICAÇÕES TÉCNICAS` the main operational section of the TR. This section MUST structure the object's execution dynamics, requirements, interfaces, responsibilities, conditions of delivery or performance, and future alignments without fabricating missing details.

#### Scenario: Technical specifications operationalize the object
- **WHEN** the TR template guides `ESPECIFICAÇÕES TÉCNICAS`
- **THEN** it instructs the model to describe execution flow, operational requirements, delivery or performance conditions, administrative interfaces, documentation or evidence when relevant, and alignment needs
- **AND** it prohibits generic bullets that merely state "execução com qualidade", "conforme especificações", or "quando aplicável" when a more concrete conservative operational formulation is possible

#### Scenario: Technical specifications support incomplete context
- **WHEN** technical information is absent or incomplete
- **THEN** the prompt instructs the model to explain how the missing definitions will be aligned or confirmed
- **AND** it does not allow invented infrastructure, rider, team, equipment, materials, cronograma, place, duration, or quantitative detail

### Requirement: TR obligations MUST be executable and fiscalizable
The `tr` recipe MUST guide contractor and contracting authority obligations to reflect the practical execution dynamics of the object. Obligations MUST be operational, inspectable, proportional, and compatible with the object, without becoming minuta-style legal clauses.

#### Scenario: Contractor obligations reflect practical execution
- **WHEN** the TR guides `OBRIGAÇÕES DA CONTRATADA`
- **THEN** the prompt instructs the model to derive obligations from the object's operational flow, including logistics, operation, communication, conformity, support, cronograma alignment, corrective action, and integration with administrative routines when compatible with the object
- **AND** it prohibits mechanical, incompatible, repetitive, or unsupported obligations

#### Scenario: Contracting authority obligations reflect administrative support
- **WHEN** the TR guides `OBRIGAÇÕES DA CONTRATANTE`
- **THEN** the prompt instructs the model to include operational support, information flow, access or institutional conditions, execution monitoring, receipt or validation, communication of issues, and payment processing after proper checks when compatible with the object
- **AND** it prohibits reducing the section to only payment duties

### Requirement: TR execution, payment, fiscalization, and sanctions sections MUST remain operational and conservative
The `tr` template MUST provide stronger operational guidance for execution period, estimated value and budget allocation, payment conditions, management and fiscalization, and administrative sanctions while preserving conservative fact handling.

#### Scenario: Execution period handles absent deadlines operationally
- **WHEN** the TR context lacks a detailed execution period, date, duration, or cronograma
- **THEN** the prompt instructs the model to describe that timing will depend on administrative programming, formal alignment, and definition in the proper instrument
- **AND** it does not invent dates, periods, or durations

#### Scenario: Estimated value and budget remain conservative
- **WHEN** estimated value or budget allocation is absent, empty, zero-like, or not supported by context
- **THEN** the prompt prohibits invented values, research, economicity, price compatibility, budget allocation, and calculation memory
- **AND** it uses institutional wording that the estimate or budget information must be apurada or indicated in the proper stage

#### Scenario: Payment conditions are tied to execution and ateste
- **WHEN** specific payment conditions are absent
- **THEN** the prompt instructs the model to structure payment conservatively around regular execution, verification or ateste, fiscal documentation, and contract conditions
- **AND** it does not invent installments, percentages, due dates, measurement regimes, or payment deadlines

#### Scenario: Management and fiscalization are executable
- **WHEN** the TR template guides `GESTÃO E FISCALIZAÇÃO DO CONTRATO`
- **THEN** it instructs the model to cover monitoring, conformity checks, communication of failures, records of occurrences, evidence of execution, receipt or acceptance, correction of nonconformities, and support for payment ateste
- **AND** it avoids excessive legalism and unsupported named fiscal agents

#### Scenario: Sanctions are realistic without invented penalties
- **WHEN** the TR template guides `SANÇÕES ADMINISTRATIVAS`
- **THEN** it instructs the model to describe consequences for nonperformance in general institutional terms
- **AND** it prohibits invented percentages, deadlines, fine amounts, penalty types, or sanction procedures not supported by context

### Requirement: TR recipe MUST adapt operational guidance by contracting type
The `tr` recipe MUST provide richer type-specific operational axes for the predominant contracting type while prohibiting copy-paste of incompatible examples.

#### Scenario: Artistic presentation TR receives event execution guidance
- **WHEN** the object indicates artistic presentation or cultural event
- **THEN** the prompt includes operational guidance for logistics, operational alignment, sound or technical alignment, stage or structure interface, support team, and event communication when compatible with context
- **AND** it prohibits invented rider, date, duration, artist credentials, exclusivity, recognition, or specific infrastructure

#### Scenario: IT or software TR receives technology operation guidance
- **WHEN** the object indicates technology, software, system, support, or IT service
- **THEN** the prompt includes operational guidance for implementation, integration, support, availability expectations, security, LGPD relevance, training, maintenance, and incident communication when compatible with context
- **AND** it prohibits invented SLA, architecture, service levels, credentials, tools, or data-processing details

#### Scenario: Consulting or advisory TR receives deliverable guidance
- **WHEN** the object indicates consulting, advisory, technical support, or administrative service
- **THEN** the prompt includes operational guidance for deliverables, reports, meetings, cronograma alignment, information flow, technical validation, confidentiality when relevant, and interaction with the requesting unit
- **AND** it prohibits invented reports, meeting cadence, deadlines, credentials, or methodology not supported by context

#### Scenario: Goods supply and equipment rental TRs receive delivery guidance
- **WHEN** the object indicates goods supply, material acquisition, equipment acquisition, or equipment rental
- **THEN** the prompt includes operational guidance for delivery or availability, receipt, conformity checks, substitution or correction, warranty or support when supported by context, conservation, and return when relevant
- **AND** it prohibits invented quantities, brands, technical standards, warranty periods, delivery deadlines, or locations

#### Scenario: Works, engineering, and events TRs receive execution-control guidance
- **WHEN** the object indicates works, engineering service, reform, event organization, or general event operation
- **THEN** the prompt includes operational guidance for cronograma alignment, technical conformity, safety, materials or suppliers when compatible, measurements or validation when supported, communication, and coordination
- **AND** it prohibits invented projects, responsible professionals, measurements, safety plans, suppliers, event providers, dates, or technical details

### Requirement: TR prompt tests MUST protect operational quality and fact safety
The document generation recipe tests MUST cover TR role separation, operational section guidance, type-specific adaptation, and anti-hallucination rules.

#### Scenario: TR prompt tests cover operational contract behavior
- **WHEN** tests build TR prompts for artistic presentation, IT/software service, consulting or HR advisory, goods supply, equipment rental, event operation, and works/reform contexts
- **THEN** each prompt includes TR operational role guidance
- **AND** each prompt strengthens technical specifications, executable obligations, management/fiscalization, payment after verification, and conservative missing-data handling
- **AND** each prompt prohibits ETP-style analysis, minuta-style legalism, generic checklist behavior, and unsupported factual claims

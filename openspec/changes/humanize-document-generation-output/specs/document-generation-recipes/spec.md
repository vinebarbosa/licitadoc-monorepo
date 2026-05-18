## ADDED Requirements

### Requirement: Recipe system MUST provide shared base writer instructions
The recipe system MUST provide a shared `base-writer.instructions.md` asset for global writer rules used by DFD, ETP, TR, and Minuta generation. Shared rules MUST include factuality, zero-value handling, placeholders, absence handling, anti-alucination, institutional tone, and invisibility of pipeline intelligence.

#### Scenario: Prompt assembly includes base writer instructions
- **WHEN** the backend assembles a prompt for DFD, ETP, TR, or Minuta
- **THEN** it includes the shared base writer instructions
- **AND** it includes the requested document type's concise instruction asset

#### Scenario: Shared rules are not duplicated across document instructions
- **WHEN** document-specific instruction files are reviewed
- **THEN** they do not repeat the full global anti-alucination, placeholder, zero-value, or factuality rule sets

### Requirement: Document-specific instructions MUST be concise role definitions
DFD, ETP, TR, and Minuta instruction assets MUST focus only on document identity, role, tone, depth, emphasis, and boundaries. They MUST NOT explain the pipeline, repeat classification logic, duplicate context-package behavior, or restate shared safety rules in full.

#### Scenario: ETP instructions focus on proportional analysis
- **WHEN** the ETP instruction asset is loaded
- **THEN** it defines ETP as proportional analysis of need, alternatives, risks, estimate, sustainability, and fiscalization
- **AND** it does not restate general anti-alucination rules already present in the base writer instructions

#### Scenario: TR instructions focus on operationalization
- **WHEN** the TR instruction asset is loaded
- **THEN** it defines TR as operational requirements for execution, receiving, obligations, fiscalization, payment, and acceptance
- **AND** it does not contain template rendering instructions or pipeline explanation

#### Scenario: Minuta instructions focus on contractual drafting
- **WHEN** the Minuta instruction asset is loaded
- **THEN** it defines Minuta as dry contractual formalization with clauses and placeholders
- **AND** it does not include ETP viability analysis or TR operational study language

### Requirement: Templates MUST be render-only assets
Document templates MUST contain only structural rendering content such as headings, placeholders, clause numbering, section order, and layout. Templates MUST NOT contain AI behavior rules, anti-alucination instructions, meta-language, safety explanations, or contextual decision logic.

#### Scenario: Template does not contain AI behavior instructions
- **WHEN** a DFD, ETP, TR, or Minuta template is reviewed
- **THEN** it does not contain instructions such as "não invente", "quando houver", "na ausência", "quando suportado", "não inclua", "não faça", "o contexto não apresenta", or similar writer-facing behavior rules

#### Scenario: Template keeps structural placeholders
- **WHEN** a template needs a value, date, signature, contractor, budget allocation, or document number
- **THEN** it contains the appropriate placeholder or structural slot
- **AND** it does not explain why the placeholder is present

### Requirement: Templates MUST preserve document structures while removing safety prose
Cleaning templates MUST NOT remove required document sections, contractual clauses, signature slots, or placeholders needed for rendering the final document.

#### Scenario: Minuta keeps contractual clause order
- **WHEN** the Minuta template is cleaned
- **THEN** it preserves the canonical contractual clause order and signature/testimony slots
- **AND** it removes AI-facing comments or instructions embedded in the clauses

#### Scenario: TR keeps operational section order
- **WHEN** the TR template is cleaned
- **THEN** it preserves the operational sections for object, justification, specifications, obligations, execution period, value/budget, payment, fiscalization, and sanctions
- **AND** it removes explanatory safety prose from the template body

## MODIFIED Requirements

### Requirement: Interface text supports PT-BR product usage
The design system MUST support a polished PT-BR product experience, including consistent typography, readable hierarchy, and correct Portuguese orthography in user-facing interface copy.

#### Scenario: Shared components display Portuguese UI copy
- **WHEN** a shared component renders labels, helper text, status text, button text, or empty-state content in Portuguese
- **THEN** the component output MUST preserve correct PT-BR accentuation and orthography

#### Scenario: Product teams add or revise UI copy
- **WHEN** new Portuguese text is introduced in screens built with the design system
- **THEN** the text MUST follow the same PT-BR orthographic standard used by existing polished UI copy

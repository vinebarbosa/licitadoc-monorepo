## ADDED Requirements

### Requirement: DFD recipe MUST use natural concrete wording for multi-item demands
The repository-managed DFD recipe MUST instruct the model that, for `multi_item` acquisitions, object description, contextualization, and essential requirements use natural administrative wording grounded in the concrete item groups present in the source context. The recipe MUST avoid artificial institutional abstractions when concrete group names are available.

#### Scenario: Multi-item DFD names concrete groups
- **WHEN** DFD generation context indicates a `multi_item` object with concrete groups such as recipientes, kits, embalagens, fitas, acessórios, or materiais auxiliares
- **THEN** the DFD recipe instructs the model to use those concrete groups or close lexical equivalents
- **AND** it avoids replacing them with expressions such as "demais grupos materiais diretamente relacionados", "componentes auxiliares", "suporte operacional", or "materialização da ação" when simpler concrete terms are available

#### Scenario: Multi-item DFD keeps administrative language simple
- **WHEN** the DFD recipe guides object and requirement wording for a simple multi-item acquisition
- **THEN** it instructs the model to prefer direct administrative language such as "kits, embalagens e materiais auxiliares" or "acondicionamento e distribuição dos materiais"
- **AND** it avoids unnecessary semantic sophistication that would make the DFD sound like refined institutional prose rather than demand formalization

### Requirement: DFD recipe MUST prevent unsupported operational inferences
The repository-managed DFD recipe MUST prohibit unsupported operational inferences in multi-item DFD text. The recipe MUST NOT encourage hygiene, technical protection, expanded safety, secure handling, or similar operational details unless those facts are present in the source context.

#### Scenario: DFD avoids hygiene and safety inferences without source support
- **WHEN** DFD generation context for a multi-item acquisition does not explicitly mention hygiene, technical protection, or specific safety requirements
- **THEN** the DFD recipe instructs the model not to infer that materials must arrive "de forma segura, higienizada" or with technical protection
- **AND** it allows only conservative administrative wording such as materials in adequate use and supply conditions

#### Scenario: Source-supported operational detail remains allowed
- **WHEN** the source context explicitly states a hygiene, safety, conservation, or technical condition
- **THEN** the DFD recipe may allow that condition to appear in proportional DFD wording
- **AND** the wording remains general enough for DFD and does not become TR-style execution detail

### Requirement: DFD essential requirements MUST remain simple for multi-item demands
The repository-managed DFD recipe MUST guide multi-item essential requirements to remain general, administrative, and proportional. The requirements MUST avoid quantities, item-level technical specification, compliance-heavy language, and TR-like operational behavior.

#### Scenario: Multi-item requirements use simple administrative terms
- **WHEN** the DFD template provides examples for multi-item essential requirements
- **THEN** the examples use simple terms such as materials in adequate use and supply conditions, compatibility with the stated purpose, and acondicionamento or distribution when supported by the source context
- **AND** they avoid phrases such as "normas básicas de segurança e qualidade para contato com produtos de uso doméstico e comemorativo" unless the source context explicitly supports them

#### Scenario: Multi-item requirements preserve existing detail limits
- **WHEN** DFD generation context indicates `multi_item`
- **THEN** the DFD recipe continues to prohibit individual quantity, unit, lot, value, capacity, and full item-level specification in essential requirements
- **AND** it keeps detailed execution, inspection, acceptance, and technical conformity for TR or subsequent instruments

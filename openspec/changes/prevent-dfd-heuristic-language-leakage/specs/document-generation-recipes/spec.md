## ADDED Requirements

### Requirement: DFD recipe MUST prohibit heuristic-language leakage
The repository-managed DFD recipe MUST instruct the model that the final DFD must not reveal internal generator reasoning, object consolidation heuristics, editorial safeguards, or prompt-processing decisions.

#### Scenario: DFD recipe rejects generator-explanation wording
- **WHEN** the DFD recipe guides multi-item object drafting
- **THEN** it instructs the model not to write final DFD text using expressions such as "item dominante", "categoria genérica", "agrupamento", "consolidação", "grupos identificados", "abstração", "agrupamento semântico", "redução do objeto", "itens correlatos identificados", or "estrutura consolidada" as explanations of the drafting process
- **AND** it instructs the model to present only the resulting administrative object and need

#### Scenario: DFD recipe gives document-facing alternatives
- **WHEN** the DFD recipe warns against heuristic-language leakage
- **THEN** it provides document-facing alternatives such as "conjunto dos materiais previstos", "materiais necessários à ação", or concrete material group names
- **AND** those alternatives do not explain how the system interpreted or consolidated the source request

### Requirement: DFD template guidance MUST avoid reusable internal vocabulary
The canonical DFD template guidance MUST avoid wording that encourages the final document to echo internal system terms. Template guidance may describe what the model should do, but it MUST clearly separate instructions from final-document language.

#### Scenario: Template object guidance stays document-facing
- **WHEN** the DFD template guides object drafting for composite acquisitions
- **THEN** it uses document-facing language for the desired output
- **AND** it avoids encouraging phrases such as "conforme agrupamento dos itens", "grupos identificados na solicitação", or "sem redução a um único produto ou item dominante" in final text

#### Scenario: Template requirements stay administrative
- **WHEN** the DFD template guides essential requirements for multi-item acquisitions
- **THEN** it uses administrative examples that can appear naturally in a DFD
- **AND** it does not frame requirements as explanations of internal grouping, consolidation, abstraction, or source-selection rules

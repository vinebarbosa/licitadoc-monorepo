## ADDED Requirements

### Requirement: Final Minuta output MUST NOT contain duplicate fixed-clause topics
The system MUST ensure final generated Minuta content contains at most one clause block for each fixed contractual topic enforced by the Minuta template. Semantically equivalent generated clauses MUST be replaced by the canonical fixed clause instead of being retained beside it.

#### Scenario: Rewrite creates alternate tail clauses
- **WHEN** a Minuta draft or rewritten draft contains generated clauses such as `DAS ALTERAÇÕES`, `DA MANUTENÇÃO DAS CONDIÇÕES DE HABILITAÇÃO`, `DA PUBLICAÇÃO`, `DOS CASOS OMISSOS`, or `DO FORO`
- **THEN** final sanitization replaces overlapping generated blocks with the canonical fixed clauses and does not append duplicates

#### Scenario: Generated and canonical forum clauses both exist
- **WHEN** a Minuta contains a generated `DO FORO` clause and the canonical `DO FORO` fixed clause would also be enforced
- **THEN** the final document contains only one `DO FORO` clause

### Requirement: Minuta closing and signatures MUST appear once at the end
The system MUST ensure a Minuta closing/signature block appears only once and is positioned after all contractual clauses.

#### Scenario: Signature appears before appended clauses
- **WHEN** a generated or rewritten Minuta contains signatures before remaining contractual clauses
- **THEN** final sanitization removes or relocates the premature signature block so the final document ends with one closing/signature block after all clauses

#### Scenario: Rewrite adds witness placeholders before fixed clauses
- **WHEN** the Final Rewrite Agent returns witnesses or signature separators before canonical fixed clauses
- **THEN** the final document does not retain that premature witness/signature block before later clauses

### Requirement: Reviewer MUST flag Minuta fixed-clause duplication
The reviewer MUST detect Minuta drafts that contain duplicated fixed-clause topics, signatures before later clauses, or model-generated replacements for canonical fixed clauses.

#### Scenario: Draft contains duplicate tail semantics
- **WHEN** the reviewer evaluates a Minuta draft with both generated `DAS ALTERAÇÕES` and canonical `DA ALTERAÇÃO E REAJUSTE` sections
- **THEN** it returns a structured issue instructing the rewrite to keep the canonical fixed clause only

#### Scenario: Draft has closing before remaining clauses
- **WHEN** the reviewer evaluates a Minuta draft where the closing/signatures are followed by additional clauses
- **THEN** it returns a structured issue instructing the rewrite to move the closing to the end and avoid duplicate clause tails

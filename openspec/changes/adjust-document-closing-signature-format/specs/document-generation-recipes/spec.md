## ADDED Requirements

### Requirement: Administrative document recipes MUST use untitled signature closing blocks
The system MUST define repository-managed DFD, ETP, and TR generation recipes so their final signature block does not include a visible `FECHO`, `ASSINATURA`, or equivalent closing heading. The final block MUST contain local/date, a signature line, responsible name, and responsible role in that order. The recipe instructions MUST direct the provider to preserve that structure and not reintroduce a closing title.

#### Scenario: Canonical templates expose untitled closing block
- **WHEN** the repository-managed templates for `dfd`, `etp`, and `tr` are reviewed or loaded for prompt assembly
- **THEN** their final closing block contains no Markdown heading matching `FECHO`, `ASSINATURA`, or an equivalent closing label
- **AND** the final block includes the local/date placeholder before a signature line
- **AND** the responsible name placeholder and responsible role placeholder appear below the signature line

#### Scenario: Recipe instructions prohibit closing headings
- **WHEN** the backend assembles a generation prompt for `dfd`, `etp`, or `tr`
- **THEN** the repository-managed instructions tell the provider not to create a visible `FECHO`, `ASSINATURA`, or equivalent heading for the closing information
- **AND** the instructions require local/date to be formatted for right alignment and the signature line, responsible name, and role to be formatted for center alignment

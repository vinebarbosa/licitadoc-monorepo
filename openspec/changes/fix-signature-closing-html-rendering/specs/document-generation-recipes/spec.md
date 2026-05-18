## ADDED Requirements

### Requirement: DFD ETP and TR recipes MUST require plain Markdown closing blocks
The system MUST define repository-managed DFD, ETP, and TR recipe instructions so the final local/date and signature block is emitted only as plain Markdown text lines. The instructions MUST explicitly forbid HTML tags, `align` attributes, inline CSS, tables, code fences, comments, or any other provider-generated layout markup for the closing block. The instructions MUST state that visual alignment is handled by the application renderer, not by markup in the generated content.

#### Scenario: Recipe instructions forbid provider layout markup
- **WHEN** the repository-managed DFD, ETP, or TR instruction asset is reviewed
- **THEN** it instructs the provider to use plain Markdown text for the final closing block and explicitly forbids HTML, `align`, inline CSS, and tables for alignment

#### Scenario: Prompt assembly preserves the plain closing contract
- **WHEN** the backend assembles a DFD, ETP, or TR generation prompt from the repository-managed recipe
- **THEN** the prompt includes the no-HTML plain-text closing rule and does not instruct the provider to create visual alignment through generated markup

### Requirement: DFD ETP and TR templates MUST keep closing placeholders semantic
The system MUST keep DFD, ETP, and TR template closing blocks as semantic placeholder lines only. The templates MUST include the local/date placeholder, a signature line, the responsible person name, and the responsible role in the expected order, without a visible closing heading and without HTML or renderer-specific layout syntax.

#### Scenario: Templates use semantic closing placeholders
- **WHEN** the DFD, ETP, or TR template asset is reviewed or loaded for prompt assembly
- **THEN** the closing block contains only plain placeholder text lines and a signature line, with no `FECHO`, `ASSINATURA`, `<div>`, `align`, CSS, or table-based layout

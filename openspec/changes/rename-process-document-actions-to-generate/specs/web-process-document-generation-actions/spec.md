## ADDED Requirements

### Requirement: Process document cards MUST use generation action labels
The process detail document cards MUST describe document creation/generation actions with generation-oriented labels. Pending document cards MUST show `Gerar` instead of `Criar`, and generated document cards MUST expose `Gerar novamente` without removing existing `Editar` and `Visualizar` actions.

#### Scenario: Pending document card shows Gerar
- **WHEN** an authenticated actor views a process detail page with a pending document card for type `tr`
- **THEN** the card shows a `Gerar` action
- **AND** the action links to `/app/documento/novo?tipo=tr&processo=<processId>`
- **AND** the card does not show `Criar`

#### Scenario: Generated document card shows Gerar novamente
- **WHEN** an authenticated actor views a process detail page with a generated document card for type `dfd`
- **THEN** the card shows a `Gerar novamente` action
- **AND** the action links to `/app/documento/novo?tipo=dfd&processo=<processId>`

#### Scenario: Existing generated document actions remain available
- **WHEN** an authenticated actor views a generated document card
- **THEN** the card still shows `Editar` when an edit link is available
- **AND** the card still shows `Visualizar` when a preview link is available

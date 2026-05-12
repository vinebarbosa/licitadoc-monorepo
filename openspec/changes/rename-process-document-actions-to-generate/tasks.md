## 1. Action Links and Labels

- [x] 1.1 Update process document action-link derivation so every document card can build a generation link from process id and document type.
- [x] 1.2 Rename pending document card primary action from `Criar` to `Gerar`.
- [x] 1.3 Add `Gerar novamente` for generated document cards with existing documents.
- [x] 1.4 Preserve existing `Editar` and `Visualizar` actions for generated cards.

## 2. Tests

- [x] 2.1 Update process model tests for generated-card regeneration links.
- [x] 2.2 Update process detail page tests to expect `Gerar` on pending cards.
- [x] 2.3 Add coverage that generated cards show `Gerar novamente` alongside `Editar` and `Visualizar`.

## 3. Validation

- [x] 3.1 Run focused process model and process detail page tests.
- [x] 3.2 Run web typecheck and Biome checks for changed files.
- [x] 3.3 Run OpenSpec validation for the change.

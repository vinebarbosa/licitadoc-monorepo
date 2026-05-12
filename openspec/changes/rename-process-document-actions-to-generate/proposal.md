## Why

The process detail document cards describe generation workflows, but pending cards currently use the action label `Criar`. This makes the AI/document-generation action feel like generic record creation, and completed cards do not offer a clear way to generate the document again.

## What Changes

- Rename pending document-card action from `Criar` to `Gerar`.
- Add a `Gerar novamente` action for document cards that already have a generated document.
- Keep existing `Editar` and `Visualizar` actions available for generated documents.
- Keep existing document creation/generation routes and API contracts unchanged unless implementation reveals a missing route contract.
- Update process detail tests to assert the new action copy and links.

## Capabilities

### New Capabilities
- `web-process-document-generation-actions`: Covers generation-oriented action labels on the process detail document cards.

### Modified Capabilities

## Impact

- Affects `apps/web/src/modules/processes/ui/process-detail-page.tsx`.
- Affects process detail model/test files if labels are centralized there.
- No database or generated API client changes are expected.

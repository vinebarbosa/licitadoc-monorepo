## Why

Solicitações de Despesa podem conter vários itens, mas o fluxo atual da criação de processo preserva apenas um item representativo. Isso impede que o usuário revise a lista real da SD e que o processo carregue a evidência completa dos itens para uso posterior.

## What Changes

- Adicionar uma área `Itens da SD` na tela de criação de processo para revisar, adicionar, editar e remover itens vinculados ao processo.
- Permitir que os itens sejam preenchidos manualmente mesmo quando o processo não vem de PDF.
- Atualizar a importação frontend de PDF TopDown para extrair uma lista simples de itens quando a SD trouxer múltiplas linhas.
- Exibir os itens extraídos no diálogo de importação antes de aplicar os dados ao formulário.
- Persistir os itens revisados no payload de criação em `sourceMetadata.extractedFields.items`, mantendo o campo legado `sourceMetadata.extractedFields.item` quando disponível.
- Manter o escopo desta primeira etapa limitado ao frontend e à persistência em metadata; não criar tabela normalizada de itens, workflow de cotação, catálogo ou geração documental baseada nesses itens.

## Capabilities

### New Capabilities
- `web-process-creation-sd-items`: Covers the process creation UI for manual and PDF-extracted SD item review, editing, and submission through source metadata.

### Modified Capabilities
- `process-management`: Process creation source metadata must preserve reviewed SD items when submitted by the frontend.

## Impact

- Frontend process creation page: `apps/web/src/modules/processes/pages/process-create-page.tsx`.
- Frontend process model and request builder: `apps/web/src/modules/processes/model/processes.ts`.
- Frontend PDF extraction/parser: `apps/web/src/modules/processes/model/expense-request-pdf.ts`.
- Process creation API payload: uses existing `sourceMetadata` JSON; no database migration is expected in this change.
- Tests: frontend parser/model tests and process creation page tests for manual items, PDF-extracted items, metadata submission, and replacement/cancel behavior.

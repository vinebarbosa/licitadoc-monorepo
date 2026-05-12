## Why

A tela de novo processo ja importa dados gerais da Solicitacao de Despesa, mas ainda nao mostra nem preserva a lista completa de itens extraidos da SD. Isso cria a impressao operacional de que o sistema leu apenas o objeto/primeiro item e deixa o usuario sem uma area clara para conferir se todos os itens foram capturados antes de criar o processo.

## What Changes

- Adicionar uma secao de itens da SD na tela `/app/processo/novo`, exibindo os itens estruturados extraidos do PDF antes e depois da aplicacao dos dados ao formulario.
- Atualizar o parser client-side de SD TopDown para extrair `items` como lista estruturada, mantendo compatibilidade com o campo legado `item`.
- Preservar codigo, descricao, quantidade, unidade, valor unitario, valor total e componentes/itens internos quando a SD trouxer itens compostos.
- Enviar os itens revisados no `sourceMetadata.extractedFields.items` ao criar o processo, para que a geracao documental use a mesma evidencia estruturada.
- Manter o comportamento atual para SDs com item unico, PDFs incompletos ou casos em que a lista nao puder ser extraida com seguranca.
- Nao transformar a secao de itens em cadastro de catalogo, cotacao ou edicao tecnica complexa nesta mudanca.

## Capabilities

### New Capabilities
- `web-process-creation-item-prefill`: Defines extraction, preview, display, and persistence of structured SD items on the web process creation form.

### Modified Capabilities
- None.

## Impact

- Frontend process creation page: `apps/web/src/modules/processes/pages/process-create-page.tsx`.
- Frontend process model and PDF extraction: `apps/web/src/modules/processes/model/processes.ts` and `apps/web/src/modules/processes/model/expense-request-pdf.ts`.
- Process creation payload: preserves item evidence through existing `sourceMetadata` without requiring a database migration.
- Tests: frontend parser/model tests, process creation page tests, and preferably one browser/e2e assertion for a multi-item SD import preview.

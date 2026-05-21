## Why

A listagem de documentos hoje aceita links como `/app/documentos?tipo=tr`, mas a pagina nao mantem os controles e a URL em sincronia depois do carregamento inicial. Isso faz a sidebar mudar apenas a barra de endereco, enquanto os selects continuam em outro estado, e tambem impede que filtros aplicados na propria pagina sejam compartilhados ou restaurados pelo historico do navegador.

## What Changes

- Tornar os filtros da pagina de documentos derivados da query string da rota, com `tipo`, `status` e `search` como parametros suportados.
- Atualizar a URL quando o usuario altera busca, tipo ou status na barra de filtros da listagem, preservando apenas parametros com valor relevante.
- Reagir a mudancas externas de rota, como cliques nos filtros da sidebar ou navegacao voltar/avancar, atualizando imediatamente os controles e os documentos exibidos.
- Normalizar valores invalidos ou ausentes para o estado padrao `todos` sem quebrar a renderizacao da pagina.
- Adicionar cobertura de testes para deep links, cliques da sidebar, mudancas nos selects, busca e restauracao via URL.

## Capabilities

### New Capabilities

- `web-documents-url-filters`: Define a sincronizacao entre URL, sidebar e controles da listagem de documentos.

### Modified Capabilities

- None.

## Impact

- Affected frontend: `apps/web/src/modules/documents/ui/documents-listing-page.tsx`, possiveis helpers em `apps/web/src/modules/documents/model/documents.ts`, e testes do modulo de documentos.
- Affected app shell: validacao dos links existentes em `apps/web/src/modules/app-shell/components/app-sidebar.tsx`, sem alterar o contrato visual da sidebar.
- APIs/dependencies: nenhuma mudanca esperada em backend, banco de dados, schemas OpenAPI ou cliente gerado.
- UX: filtros passam a ser compartilhaveis, restauraveis e consistentes entre sidebar, selects e resultado filtrado.

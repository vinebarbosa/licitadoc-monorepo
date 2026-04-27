## Why

A listagem de documentos ja oferece a acao "Visualizar", mas a rota `/app/documento/:documentId/preview` ainda nao existe. Usuarios precisam abrir um documento gerado para revisar o conteudo salvo, entender seu status e voltar ao fluxo de documentos/processos sem depender de endpoints ou telas externas.

## What Changes

- Adicionar uma pagina protegida de preview de documento em `/app/documento/:documentId/preview`.
- Consumir o detalhe real do documento pelo cliente gerado/React Query e renderizar metadados, status, processo vinculado e conteudo do rascunho quando disponivel.
- Tratar estados de carregamento, erro, documento em geracao, documento com falha e documento sem conteudo concluido.
- Disponibilizar a navegacao natural de volta para a listagem de documentos e para o processo relacionado quando houver `processId`.
- Adicionar cobertura de testes para roteamento, renderizacao do conteudo e estados principais da pagina.

## Capabilities

### New Capabilities
- `web-document-preview-page`: Define a pagina frontend de preview de documento, incluindo leitura do detalhe, apresentacao do conteudo gerado e estados operacionais.

### Modified Capabilities

## Impact

- Affected frontend: `apps/web/src/app/router.tsx`, `apps/web/src/modules/documents`, fixtures/handlers MSW, testes React e possivel cobertura Playwright.
- API client: usa o contrato existente de `GET /api/documents/:documentId`; regeneracao so sera necessaria se a implementacao descobrir divergencia entre schemas e cliente gerado.
- UX: a acao "Visualizar" da listagem passa a levar a uma pagina funcional de leitura, com preview em layout de documento e feedback claro para estados nao concluidos.

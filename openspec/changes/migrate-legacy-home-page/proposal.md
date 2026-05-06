## Why

A area autenticada do sistema ainda abre em uma pagina vazia, embora a UI validada da Central de Trabalho ja exista em `tmp/dashboard.tsx`. A home real precisa colocar os atalhos, a retomada mockada e os processos recentes no app shell atual sem reinventar o desenho aprovado.

## What Changes

- Implementar a pagina inicial autenticada em `/app` preservando a composicao visual, textos, hierarquia, cards, badges e tabela da UI validada em `tmp/dashboard.tsx`.
- Adaptar imports e composicao para a arquitetura atual do web app, usando o header/breadcrumb ja fornecido pelo `AppShellLayout`.
- Manter "Acoes Rapidas" com links para criacao de DFD, ETP, TR e Minuta.
- Manter "Continuar de onde parei" com dados mockados nesta primeira entrega, porque ainda nao existe contrato confiavel para retomada real.
- Alimentar "Processos de Contratacao" com `GET /api/processes` por meio do adapter web existente, incluindo loading, vazio e erro.
- Adicionar cobertura de teste da pagina para garantir que a UI validada aparece e que os processos vem da API.

## Capabilities

### New Capabilities
- `web-app-home-page`: Define a experiencia da pagina inicial autenticada da Central de Trabalho com atalhos, retomada mockada e processos recentes vindos da API.

### Modified Capabilities

## Impact

- Affected code: `apps/web/src/modules/app-shell/pages/app-home-page.tsx`, possiveis helpers locais do modulo app-shell, fixtures/MSW e testes web.
- APIs: nenhuma mudanca esperada; usar `GET /api/processes` existente. Ajustar a API somente se a implementacao revelar uma lacuna real.
- Dependencies: nenhuma dependencia nova esperada.
- Systems: rota autenticada `/app`, app shell, cliente gerado `@licitadoc/api-client` e experiencia web de processos/documentos.

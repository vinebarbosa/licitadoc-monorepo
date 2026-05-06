## Why

A tela validada de processos existe apenas em `tmp/processos.tsx`, com dados mockados e sem rota funcional na arquitetura nova. O produto precisa que a pagina real de Processos de Contratacao preserve essa UI e consuma uma listagem backend capaz de alimentar a tabela, filtros e progresso documental por processo.

## What Changes

- Implementar a pagina real de listagem de processos em `apps/web`, preservando a hierarquia visual, densidade, tabela, filtros, badges e indicador de documentos da UI validada em `tmp/processos.tsx`.
- Adicionar rota protegida para `/app/processos` e compor a pagina dentro do app shell atual, mantendo breadcrumb, sidebar e CTA de novo processo.
- Criar modulo web de processos com entrypoint de pagina, UI, model/helpers e adaptador de API usando `@licitadoc/api-client`.
- Evoluir `GET /api/processes` para aceitar busca e filtros necessarios para a listagem, mantendo paginacao e autorizacao por organizacao.
- Retornar em cada item da listagem os dados necessarios para a tabela: numero do processo, nome/objeto, status, tipo, responsavel, ultima atualizacao e progresso de documentos.
- Calcular progresso documental no backend com base nos tipos esperados `dfd`, `etp`, `tr` e `minuta`, considerando completo apenas documento com tipo esperado e `status = completed`.
- Expor no item de listagem `documents.completedCount`, `documents.totalRequiredCount`, `documents.completedTypes` e `documents.missingTypes`.
- Fazer a data de ultima atualizacao da listagem considerar a maior data entre o processo e seus documentos relacionados quando isso puder ser feito sem migracao estrutural.
- Regenerar o cliente de API se o contrato OpenAPI mudar.

## Capabilities

### New Capabilities
- `web-processes-listing-page`: Define a experiencia real da pagina de listagem de Processos de Contratacao com paridade visual em relacao a `tmp/processos.tsx` e dados vindos da API.

### Modified Capabilities
- `process-management`: A listagem de processos passa a suportar busca, filtros e agregacoes documentais por processo para uso operacional da tela.

## Impact

- Affected code: `apps/api/src/modules/processes/**`, `apps/api/src/modules/documents/**` apenas para leitura/agregacao de documentos, schemas OpenAPI/Zod, testes unitarios/e2e de processos, `apps/web/src/app/router.tsx`, novo modulo `apps/web/src/modules/processes/**`, MSW/test fixtures e testes de pagina.
- APIs: evolucao compativel de `GET /api/processes` com query params opcionais e campos adicionais por item; nao deve exigir mudanca nos callers existentes.
- Database: nenhuma migracao esperada; usar tabelas atuais `processes`, `process_departments` e `documents`. Migrar somente se a implementacao demonstrar necessidade real.
- Systems: app shell autenticado, sidebar de processos, cliente gerado `@licitadoc/api-client`, validacao OpenAPI e experiencia web protegida.

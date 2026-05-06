## Why

A rota de detalhe do processo ainda nao existe na arquitetura web nova, enquanto a UI validada do produto vive apenas em `tmp/processo.tsx` com dados mockados. A aplicacao precisa migrar essa tela sem reinventar o desenho e conectar a experiencia a dados reais do processo, departamentos e documentos.

## What Changes

- Migrar a UI validada de `tmp/processo.tsx` para o modulo novo de processos no frontend.
- Registrar a rota protegida `/app/processo/:processId` e conectar a listagem existente a essa rota.
- Consumir `GET /api/processes/:processId` pelo cliente gerado/React Query para renderizar o detalhe.
- Enriquecer a resposta de detalhe do processo com dados necessarios para a tela: resumo do processo, departamentos vinculados, datas, valor estimado quando disponivel e cards dos documentos DFD, ETP, TR e Minuta.
- Ajustar a API, schemas OpenAPI e testes para retornar o novo payload de detalhe sem quebrar criacao, atualizacao ou listagem.
- Manter a UI legada como contrato visual: estrutura, hierarquia, cards, badges, icones e acoes devem ser migrados para os componentes atuais, nao redesenhados.
- Incluir estados de carregamento, erro, vazio/nao encontrado e cobertura unit/e2e.

## Capabilities

### New Capabilities

- `web-process-detail-page`: Define a pagina de detalhe do processo na arquitetura web nova, baseada na UI legada validada e conectada a API real.

### Modified Capabilities

- `process-management`: Adiciona ao detalhe de processo da API um payload enriquecido com departamentos e resumo de documentos necessario para a tela.

## Impact

- Affected frontend: `apps/web/src/modules/processes`, `apps/web/src/app/router.tsx`, MSW fixtures/handlers, testes React e Playwright.
- Affected backend: `apps/api/src/modules/processes/get-process.ts`, `processes.shared.ts`, `processes.schemas.ts`, testes de processos e OpenAPI gerado.
- API: `GET /api/processes/:processId` passa a retornar campos adicionais para detalhe; os campos existentes do perfil do processo permanecem.
- API client: regenerar `@licitadoc/api-client` apos alterar OpenAPI.
- UX: implementa a tela de detalhe com a mesma composicao visual de `tmp/processo.tsx` e da imagem de referencia.

## Why

A navegacao atual ja expoe `Documentos` no app shell, mas a rota `/app/documentos` ainda nao existe na arquitetura web nova. Ao mesmo tempo, a UI validada do produto vive apenas em `tmp/documentos.tsx` com dados mockados. A aplicacao precisa migrar essa tela sem redesenhar a interface e conectar a experiencia a dados reais de documentos.

## What Changes

- Migrar a UI validada de `tmp/documentos.tsx` para um modulo/pagina da arquitetura nova em `apps/web/src/modules`.
- Registrar a rota protegida `/app/documentos` e manter compatibilidade com os filtros ja linkados pelo sidebar, incluindo `?tipo=`.
- Implementar a experiencia validada da listagem de documentos: cabecalho, cards de resumo, busca, filtros por tipo/status, tabela, menu de acoes e estados de carregamento/erro/vazio.
- Consumir a listagem real de documentos pelo cliente gerado/React Query em vez de dados mockados.
- Enriquecer a API de documentos quando necessario para que a tela renderize processo relacionado, metadados visiveis e acoes sem depender de buscas adicionais por linha.
- Adicionar ou atualizar cobertura de testes no frontend e na API para a rota, o payload e os estados principais da pagina.

## Capabilities

### New Capabilities

- `web-documents-page`: Define a pagina de documentos na arquitetura web nova, preservando a UI legada validada e conectando a tela a dados reais.

### Modified Capabilities

- `document-generation`: Ajusta o contrato de listagem de documentos para expor o contexto necessario da tela migrada, incluindo metadados de processo e resumo operacional por documento quando necessario.

## Impact

- Affected frontend: `apps/web/src/app/router.tsx`, novo modulo/pagina de documentos, adaptadores React Query, fixtures MSW e testes React/Playwright.
- Affected backend: `apps/api/src/modules/documents`, schemas/OpenAPI e testes do endpoint de listagem de documentos caso o payload precise ser enriquecido.
- API client: pode exigir regeneracao de `@licitadoc/api-client` se o contrato de documentos mudar.
- UX: a tela de `tmp/documentos.tsx` vira a implementacao real no app protegido, mantendo estrutura, hierarquia visual, tabela, badges, icones e acoes aprovadas pelo produto.
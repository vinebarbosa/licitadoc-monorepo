## Why

A aplicacao ja referencia a experiencia de criar documentos por links como `/app/documento/novo?tipo=...&processo=...`, mas essa rota ainda nao existe na arquitetura web atual. A UI validada do produto permanece apenas em `tmp/documento-novo.tsx` com dados simulados, o que impede concluir o fluxo real de criacao sem reinventar a interface aprovada.

## What Changes

- Migrar a UI validada de `tmp/documento-novo.tsx` para um modulo publico de `apps/web/src/modules/documents`, preservando layout, hierarquia visual, copy, cards de selecao e a experiencia geral ja aprovada pelo produto.
- Registrar a rota protegida `/app/documento/novo` na arquitetura atual e manter compatibilidade com os deep links ja emitidos por outras telas, incluindo `?tipo=` e `?processo=`.
- Conectar o formulario a dados reais para selecionar o processo visivel ao ator autenticado, preencher o nome inicial do documento e submeter a criacao pelo fluxo real de geracao de documento.
- Redirecionar o usuario para o destino funcional esperado apos a criacao do documento e exibir estados de carregamento, validacao e erro sem alterar a UI validada.
- Adicionar ou atualizar testes React, MSW e Playwright para cobrir pre-preenchimento por query string, submissao, navegacao e estados principais da tela migrada.
- Ajustar o contrato de criacao de documentos para aceitar um nome customizado opcional, preservando o fallback automatico atual quando o ator nao informar nome.
- Reaproveitar os contratos de API existentes para listar processos e criar documentos, fazendo apenas os ajustes minimos necessarios para a tela migrada operar com dados reais.

## Capabilities

### New Capabilities
- `web-document-create-page`: Define a pagina protegida de criacao de documento na arquitetura web atual, preservando a UI validada, consumindo dados reais e honrando deep links originados de outras telas.

### Modified Capabilities
- `document-generation`: Expande a criacao de documentos para aceitar nome customizado opcional sem perder o comportamento atual de nome padrao derivado do processo.

## Impact

- Affected frontend: `apps/web/src/app/router.tsx`, `apps/web/src/modules/documents/**`, possiveis adaptadores de processos/documentos, fixtures MSW e testes React/Playwright.
- Affected backend/API: `apps/api/src/modules/documents/**` e possivelmente o cliente gerado de documentos para suportar o nome customizado opcional na criacao.
- API client: deve reutilizar ou regenerar hooks/modelos de `@licitadoc/api-client` se o payload de criacao de documentos for ajustado.
- UX: o fluxo de `Novo Documento` deixa de depender de mock local e passa a funcionar no shell protegido com a mesma interface aprovada.
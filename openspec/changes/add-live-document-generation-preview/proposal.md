## Why

O backend já consegue consumir o stream real do Ollama, mas a experiência do usuário ainda mostra apenas um estado estático de "gerando" até o conteúdo final ser persistido. A página de preview deve acompanhar a geração em tempo real para que documentos longos tenham feedback visível enquanto são produzidos.

## What Changes

- Expor um canal autenticado de eventos de geração para documentos em `generating`, enviando conteúdo parcial, status final e erros normalizados.
- Estender o contrato de geração para permitir callbacks de chunks sem quebrar o retorno final existente de `generateText`.
- Publicar chunks do provider Ollama no fluxo de geração do documento, mantendo o conteúdo persistido definitivo somente ao finalizar com sucesso.
- Atualizar o preview do documento no frontend para assinar o canal em tempo real, renderizar o rascunho parcial no layout validado do documento e cair para o polling atual quando o stream não estiver disponível.
- Desabilitar ações de exportação/impressão durante geração parcial e revalidar o detalhe do documento ao receber conclusão ou falha.
- Cobrir o fluxo com testes de API/provider/worker e testes de UI para stream ativo, fallback e estados finais.

## Capabilities

### New Capabilities

- `web-document-live-preview`: A experiência frontend de preview deve renderizar conteúdo parcial em tempo real enquanto o documento é gerado.

### Modified Capabilities

- `generation-provider`: O contrato de provider deve permitir emissão incremental de chunks para consumidores internos, preservando o resultado final normalizado.
- `document-generation`: A geração de documentos deve publicar eventos de progresso autorizados para que clientes acompanhem conteúdo parcial e estados finais.

## Impact

- API:
  - `apps/api/src/shared/text-generation/types.ts`
  - `apps/api/src/shared/text-generation/ollama-provider.ts`
  - `apps/api/src/shared/text-generation/openai-provider.ts`
  - `apps/api/src/shared/text-generation/stub-provider.ts`
  - `apps/api/src/modules/documents/document-generation-worker.ts`
  - `apps/api/src/modules/documents/routes.ts`
  - `apps/api/src/modules/documents/documents.schemas.ts`
  - Testes de geração/documentos/text generation
- Web:
  - `apps/web/src/modules/documents/api/documents.ts`
  - `apps/web/src/modules/documents/ui/document-preview-page.tsx`
  - `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
  - Fixtures/MSW de documentos quando necessário
- Sem migração de banco prevista; o stream pode ser transitório e o conteúdo final continua sendo persistido pelo fluxo atual.

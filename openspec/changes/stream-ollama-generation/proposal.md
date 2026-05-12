## Why

O provider Ollama hoje usa resposta não-streaming e mantém um timeout de requisição inteira, o que pode encerrar gerações longas de documentos por volta de `5m1s` mesmo quando o Ollama ainda está produzindo tokens. A integração precisa consumir o stream real do Ollama para suportar documentos maiores sem transformar uma geração ativa em falha por timeout.

## What Changes

- Refatorar o adapter Ollama para chamar `/api/generate` com `stream: true`.
- Consumir a resposta NDJSON do Ollama incrementalmente, acumulando os trechos `response` até o chunk final `done`.
- Preservar o contrato público `TextGenerationProvider.generateText`, retornando o texto completo e metadados normalizados somente ao final da geração.
- Eliminar o abort por tempo total em streams ativos do Ollama, evitando que gerações longas sejam interrompidas enquanto ainda recebem chunks.
- Manter a normalização de falhas do provider para erros HTTP, erros emitidos no stream, resposta vazia e indisponibilidade do serviço.
- Atualizar a cobertura de testes do provider Ollama para streaming real, chunks fracionados, metadados finais e ausência do timeout total em streams ativos.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `generation-provider`: O provider Ollama deve usar geração streaming real e não deve abortar gerações longas ativas por timeout total de requisição.

## Impact

- `apps/api/src/shared/text-generation/ollama-provider.ts`
- `apps/api/src/shared/text-generation/text-generation.test.ts`
- Nenhuma mudança esperada em rotas HTTP, schema de banco, contrato público do worker de documentos ou cliente gerado.

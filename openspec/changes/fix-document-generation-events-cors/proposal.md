## Why

O acompanhamento em tempo real da geração de documentos não aparece porque o request `EventSource` para `/api/documents/:documentId/events` está falhando com `CORS error`. A rota SSE escreve a resposta manualmente, então precisa garantir os headers CORS exigidos pelo navegador quando usa sessão com credenciais.

## What Changes

- Adicionar headers CORS manuais à resposta SSE de `/api/documents/:documentId/events` para origins permitidos pela configuração.
- Refletir somente origins autorizados e incluir suporte a credenciais de sessão no stream.
- Preservar o contrato atual de eventos, o fallback por polling e a autenticação/visibilidade do documento.
- Cobrir o comportamento com testes para origin permitido e origin não permitido.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `document-generation`: O stream de progresso de geração deve ser consumível por browsers autorizados sob CORS configurado e credenciais de sessão.

## Impact

- `apps/api/src/modules/documents/routes.ts`
- Testes de API para a rota/event stream de geração de documentos.
- Sem mudança de banco, sem regeneração de API client e sem alteração obrigatória no frontend.

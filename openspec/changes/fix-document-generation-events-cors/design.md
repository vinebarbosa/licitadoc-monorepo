## Context

O frontend abre `/api/documents/:documentId/events` com `EventSource` e credenciais para acompanhar a geração do documento em tempo real. A rota SSE no backend usa resposta raw/hijack para manter a conexão aberta, então os headers aplicados pelo plugin CORS do Fastify não entram automaticamente nessa resposta. No navegador, isso aparece como `CORS error` no request `events`, e a tela cai no fallback de polling.

## Goals / Non-Goals

**Goals:**

- Permitir que browsers em origins configurados abram o stream SSE autenticado.
- Manter a resposta como `text/event-stream` e preservar o contrato atual de eventos.
- Evitar headers CORS permissivos para origins não configurados.
- Cobrir a correção com testes de rota ou helper de headers.

**Non-Goals:**

- Trocar SSE por WebSocket ou outra tecnologia de transporte.
- Alterar a integração Ollama, o formato dos chunks ou a fila de geração.
- Mudar o fallback por polling no frontend.
- Abrir o stream para acesso público ou sem sessão.

## Decisions

1. A rota SSE deve resolver o origin permitido antes de escrever a resposta raw.

   A implementação deve ler a lista de origins permitidos de `app.config.CORS_ORIGIN`, comparar com `request.headers.origin` e refletir somente o origin exato que foi configurado. Isso evita o uso de `*`, que não é compatível com credenciais, e mantém o comportamento alinhado à configuração já existente do app.

2. A resposta raw do SSE deve incluir manualmente os headers CORS necessários.

   Quando o origin for permitido, `writeHead` deve incluir `access-control-allow-origin`, `access-control-allow-credentials: true` e `vary: Origin`, além dos headers SSE atuais (`content-type`, `cache-control` e `connection`). Como a conexão é mantida aberta manualmente, esses headers precisam ser definidos antes do primeiro `write`.

3. Origins não permitidos não devem receber CORS permissivo.

   Se houver header `Origin` e ele não corresponder à configuração, a rota não deve refletir esse origin nem emitir headers que autorizem credenciais. A autenticação e a checagem de acesso ao documento continuam acontecendo antes de abrir o stream.

4. O teste deve validar o contrato de browser, não detalhes do cliente.

   A cobertura pode testar a rota SSE diretamente ou extrair a montagem de headers para um helper pequeno e testável. O ponto crítico é garantir que um origin permitido recebe os headers corretos e que um origin não permitido não recebe uma autorização indevida.

## Risks / Trade-offs

- `CORS_ORIGIN` mal configurado continua bloqueando o navegador. Mitigação: refletir somente origins exatos e manter o teste com `http://localhost:5173`, que é o origin usado em desenvolvimento.
- Escrever headers tarde demais quebra a conexão SSE no navegador. Mitigação: calcular e passar todos os headers no `writeHead` antes de qualquer evento.
- Testar SSE com conexão aberta pode ser mais trabalhoso que testar request/response comum. Mitigação: isolar a lógica de headers quando necessário e manter um teste de integração mínimo para a rota.

## Context

O módulo `invites` foi implementado recentemente e hoje a rota `GET /api/invites` devolve todos os convites visíveis para o ator atual em um único payload `{ items }`. A implementação já ordena por `createdAt desc` e respeita escopo por papel, mas ainda não aplica limite, deslocamento nem metadados de paginação.

Ao mesmo tempo, o projeto já possui um helper compartilhado em `apps/api/src/shared/http/pagination.ts` que normaliza `page` e `pageSize` com defaults e limites. Isso cria uma oportunidade de padronizar a listagem de convites sem introduzir um padrão novo de navegação.

## Goals / Non-Goals

**Goals:**
- Paginar a listagem de convites por `page` e `pageSize`.
- Manter a ordenação e o escopo atual dos resultados para `admin` e `organization_owner`.
- Expor metadados suficientes para o cliente navegar entre páginas sem cálculos implícitos.
- Atualizar o contrato OpenAPI e o cliente gerado para o novo formato.

**Non-Goals:**
- Migrar a paginação da API inteira para um padrão novo.
- Adotar paginação por cursor nesta change.
- Alterar as rotas de criação, preview por token ou aceite de convite.

## Decisions

### 1. Usar paginação baseada em `page` e `pageSize`

A listagem de convites deve aceitar `page` e `pageSize` como query params, reutilizando `normalizePagination()` para aplicar default `1`, default `20` e limite máximo `100`.

Isso mantém a mudança pequena, consistente com o helper já existente e fácil de consumir pelo frontend e pelo cliente gerado. Também evita introduzir complexidade de cursor para uma coleção que hoje já usa ordenação simples por data de criação.

Alternativas consideradas:
- Paginação por cursor: melhor para volumes muito altos, mas aumenta a complexidade do contrato e não aproveita o helper já disponível.
- Apenas `limit`/`offset`: funciona no backend, mas expõe um contrato menos amigável para telas administrativas.

### 2. Retornar metadados explícitos no payload paginado

A resposta de `GET /api/invites` deve incluir `items` e metadados explícitos, como `page`, `pageSize`, `total` e `totalPages`.

Esse formato reduz ambiguidade para consumidores e evita que cada cliente precise recalcular paginação ou inferir se existem páginas seguintes com base apenas no tamanho do array retornado.

Alternativas consideradas:
- Retornar apenas `items` e `hasNextPage`: simplifica levemente o payload, mas entrega menos informação para tabelas administrativas.
- Aninhar tudo em `meta`: é válido, mas adiciona uma camada extra sem benefício claro para o padrão atual da API.

### 3. Preservar escopo antes de aplicar contagem e recorte

As regras de visibilidade já existentes devem continuar valendo: `admin` vê todos os convites; `organization_owner` vê apenas convites da própria organização. A consulta paginada e a consulta de contagem devem usar exatamente o mesmo filtro antes de calcular `total` e antes de aplicar `limit/offset`.

Isso garante consistência entre o número total informado ao cliente e os itens que realmente podem aparecer na página atual.

Alternativas consideradas:
- Contar tudo e filtrar só na consulta paginada: cria metadados incorretos para `organization_owner`.

## Risks / Trade-offs

- **[Mudança de contrato em `/api/invites`]** -> Mitigar atualizando OpenAPI, cliente gerado e consumidores no mesmo ciclo.
- **[Divergência entre `total` e itens retornados]** -> Mitigar reaproveitando o mesmo predicado de escopo na query principal e na query de contagem.
- **[Parâmetros inválidos ou extremos]** -> Mitigar usando `normalizePagination()` para aplicar defaults e limites previsíveis.

## Migration Plan

1. Adicionar query params e schema de resposta paginada à rota `GET /api/invites`.
2. Ajustar o serviço de listagem para calcular contagem total e aplicar `limit/offset`.
3. Regenerar OpenAPI e `packages/api-client`.
4. Cobrir a paginação com testes de contrato e escopo.

Rollback:
- Restaurar a resposta simples `{ items }` e remover os query params da listagem de convites.
- Regenerar OpenAPI e cliente com o contrato anterior.

## Open Questions

Nenhuma aberta no momento. Esta change assume paginação baseada em página numérica porque o projeto já possui utilitário compartilhado para esse padrão.

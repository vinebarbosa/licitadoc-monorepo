## Context

O app web já expõe a navegação administrativa em `/app/admin/usuarios`, mas a rota ainda não existe e não há módulo de frontend para essa área. A referência legada em `/tmp/usuarios.tsx` define a direção visual e funcional da experiência, mas usa mocks, papéis antigos (`SUPER_ADMIN` e `ORG_ADMIN`) e uma ação de criação direta que não corresponde ao domínio atual.

Na API, o módulo `users` já cobre leitura, atualização e remoção de usuários armazenados, porém a listagem ainda aceita apenas `page` e `pageSize`. Além disso, o próprio módulo documenta que criação de usuário permanece no fluxo `invite + auth`, o que significa que a tela administrativa precisa provisionar novos `organization_owner` por convite, não por um endpoint de criação direta.

## Goals / Non-Goals

**Goals:**
- Entregar uma página administrativa funcional em `/app/admin/usuarios`, acessível apenas a `admin`.
- Migrar a referência legada para os papéis e fluxos atuais do produto.
- Adicionar filtros server-side na listagem de usuários para busca por nome/e-mail, papel e organização.
- Permitir que a tela use os endpoints existentes de detalhe, atualização, exclusão e criação de convites.
- Manter paginação, autorização e contrato OpenAPI/client coerentes entre API e web.

**Non-Goals:**
- Criar um endpoint novo de cadastro direto de usuários.
- Introduzir soft delete ou um estado persistido de “desativado” para usuários nesta change.
- Construir uma área equivalente para `organization_owner`; o foco desta change é a experiência de `admin`.
- Redesenhar o módulo de organizações ou criar um endpoint novo apenas para opções de filtro.

## Decisions

### 1. Criar um módulo web dedicado e proteger a rota por papel

A implementação deve introduzir `apps/web/src/modules/users` com uma página administrativa própria, componentes locais e adaptadores para a API. A rota `/app/admin/usuarios` será registrada no router principal e protegida por `RequireSession` combinada com `hasRequiredRole(role, ["admin"])`, usando a tela de não autorizado já existente para atores fora do escopo.

Também é desejável esconder o item de navegação administrativa para usuários que não sejam `admin`, evitando expor uma entrada que hoje aparece para qualquer sessão autenticada.

Alternativas consideradas:
- Deixar a proteção apenas no componente da página: funciona, mas mantém a navegação inconsistente e deixa a autorização espalhada.
- Reaproveitar o índice de `app-shell` sem um módulo dedicado: reduz arquivos no curto prazo, mas mistura uma área administrativa inteira com a home do app.

### 2. Manter o estado da listagem na URL e usar filtros server-side

A página deve tratar paginação e filtros como estado de URL (`page`, `pageSize`, `search`, `role`, `organizationId`) para permitir navegação estável, refresh sem perda de contexto e links compartilháveis. A busca textual deve ser debounced no cliente, mas a filtragem efetiva ficará no backend para preservar consistência com a paginação e com o escopo administrativo.

No backend, `GET /api/users` passará a aceitar:
- `search`: termo opcional que casa com `name` ou `email` de forma case-insensitive;
- `role`: filtro opcional por `admin`, `organization_owner` ou `member`;
- `organizationId`: filtro opcional por organização.

O serviço deve aplicar primeiro o escopo do ator autenticado e só então os filtros opcionais. Para `admin`, `organizationId` reduz a busca à organização informada. Para `organization_owner`, qualquer filtro de organização divergente deve ser ignorado ou resolvido para o próprio escopo do ator, sem permitir fuga de visibilidade.

Alternativas consideradas:
- Buscar uma página e filtrar localmente: quebra paginação real, distorce totais e pode esconder usuários fora da página atual.
- Criar um endpoint administrativo novo só para a tela: duplica regras já pertencentes a `user-management`.

### 3. Compor métricas e nomes de organização a partir de endpoints existentes

Para manter o delta de backend focado nos filtros, a tela web deve compor os demais dados necessários com consultas já existentes:
- os cards de resumo usarão chamadas leves para `GET /api/users`, aproveitando `total` com combinações previsíveis de filtros por papel;
- os nomes e opções de organização virão de `GET /api/organizations`, agregando as páginas visíveis ao `admin` em memória/cache para montar o mapa `organizationId -> name` e preencher selects.

Essa composição mantém o contrato de `user-management` simples e evita introduzir um payload administrativo ad hoc apenas para a primeira versão da tela.

Alternativas consideradas:
- Enriquecer `GET /api/users` com nomes de organização, facetas e métricas agregadas: reduziria chamadas do frontend, mas ampliaria a mudança de contrato muito além do filtro pedido.
- Criar um endpoint específico para opções de organização: simplifica o cliente, mas adiciona superfície nova sem necessidade imediata.

### 4. Provisionar novos organization owners via convite

O CTA principal da página deve reutilizar `POST /api/invites` para criar convites de `organization_owner`. Isso exige adaptar a referência legada:
- o modal de criação coleta `email` e `organizationId`;
- o campo de nome não é persistido nesse fluxo e não deve ser exigido;
- a cópia da interface deve deixar claro que o acesso será provisionado por convite.

Esse desenho respeita a decisão já existente em `users/routes.ts`, onde criação direta de usuário fica fora do módulo de gerenciamento.

Alternativas consideradas:
- Criar um endpoint `createUser`: diverge do fluxo atual de onboarding e duplicaria regras do Better Auth.
- Manter o modal legado com nome obrigatório: cria uma promessa de dado que a API atual não armazena no convite.

### 5. Mapear as ações da tela legada para as capacidades reais do domínio

A referência antiga tem ações separadas para ver detalhes, editar usuário, alterar papel e desativar. Na implementação nova, o fluxo pode ser consolidado em um painel/modal de detalhe e edição que reaproveita `GET /api/users/:userId` e `PATCH /api/users/:userId`, enquanto a ação destrutiva usa `DELETE /api/users/:userId` com confirmação explícita.

Nesta change, “desativar” será tratado como remoção do usuário gerenciado, com cópia e affordances coerentes com essa semântica. Não será introduzido um estado novo de usuário inativo.

Alternativas consideradas:
- Reproduzir fielmente a ação de desativação: exigiria novo campo persistido, novas policies e mudança de comportamento fora do escopo.
- Criar telas separadas para detalhe e edição: aumenta a superfície sem ganho funcional relevante para a primeira entrega.

## Risks / Trade-offs

- **[Múltiplas consultas no frontend para cards e organizações]** -> Mitigar com React Query, chaves estáveis e reaproveitamento de cache entre filtros e navegações.
- **[Busca textual frequente pode gerar refetch excessivo]** -> Mitigar com debounce curto no campo de busca e reset de paginação ao alterar filtros.
- **[Ação destrutiva difere da affordance “desativar” da tela legada]** -> Mitigar com cópia explícita de exclusão, diálogo de confirmação e remoção de rótulos ambíguos.
- **[Carregar todas as organizações visíveis pode exigir várias páginas]** -> Mitigar agregando páginas apenas uma vez por sessão e revisitando um endpoint dedicado apenas se a escala real justificar.

## Migration Plan

1. Estender `users.schemas.ts`, `users/routes.ts` e `get-users.ts` para aceitar os novos filtros e cobrir os cenários com testes.
2. Regenerar `packages/api-client` para expor os parâmetros adicionais de `GET /api/users`.
3. Implementar o módulo web de usuários, registrar a rota protegida, esconder a navegação para não-admins e integrar consultas de usuários, organizações e convites.
4. Cobrir a nova área com testes web focados em autorização, carregamento da tabela, filtros e ações principais.

Rollback:
- Remover a rota e o módulo web de usuários.
- Reverter os parâmetros extras da listagem de usuários e regenerar o client.
- Restaurar a navegação administrativa ao estado anterior, se necessário.

## Open Questions

Nenhuma em aberto. Esta change assume que a primeira versão administrativa usará exclusão em vez de desativação e que o fluxo de criação de administradores continua sendo feito por convite.
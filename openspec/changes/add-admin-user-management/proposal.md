## Why

O app já expõe a navegação para `/app/admin/usuarios`, e existe uma referência de interface legada em `/tmp/usuarios.tsx`, mas a experiência ainda não foi migrada para a aplicação atual. Isso deixa o `admin` sem uma tela real para consultar e gerenciar usuários, e a API de listagem ainda não oferece os filtros necessários para sustentar busca por nome/e-mail, papel e organização.

## What Changes

- Adicionar uma experiência administrativa de gerenciamento de usuários em `apps/web` para a rota `/app/admin/usuarios`, usando dados reais da API em vez de mocks.
- Entregar tabela paginada com busca, filtros por papel e organização, métricas resumidas, estados de loading/empty e ações administrativas compatíveis com as permissões atuais.
- Mapear a referência legada para os papéis atuais do produto: `Super Admin` passa a `admin` e `Admin Org.` passa a `organization_owner`.
- Reaproveitar o fluxo de convites para provisionar novos `organization_owner` a partir da tela administrativa, evitando criação direta de usuários fora do modelo atual de onboarding.
- Estender o contrato de listagem de usuários para aceitar filtros server-side e manter paginação, escopo de visibilidade e cliente gerado coerentes.

## Capabilities

### New Capabilities
- `web-admin-user-management`: Define a experiência web de gestão de usuários para `admin`, incluindo listagem paginada, filtros, ações de gerenciamento e provisionamento de novos `organization_owner` via convite.

### Modified Capabilities
- `user-management`: A listagem de usuários passa a aceitar filtros por termo de busca, papel e organização sem violar o escopo administrativo do ator autenticado.

## Impact

- Afeta `apps/web`, com nova rota/módulo administrativo de usuários e integração com o cliente gerado.
- Afeta `apps/api`, principalmente o módulo `users`, schemas OpenAPI e possivelmente validações de filtros no backend.
- Afeta `packages/api-client`, que precisará ser regenerado para expor os novos parâmetros de consulta da listagem.
- Exige cobertura de testes para a nova superfície web e para os filtros adicionados na API.
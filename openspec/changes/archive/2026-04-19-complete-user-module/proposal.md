## Why

O módulo `users` ainda está incompleto: as rotas atuais retornam dados mockados, não consultam o banco, não respeitam escopo real por organização e os handlers de escrita continuam sem implementação. Isso deixa a área administrativa sem um fluxo confiável para consultar e manter usuários já provisionados no sistema.

## What Changes

- Substituir listagem e detalhe de usuários por consultas reais à tabela `users`.
- Finalizar o módulo com contratos e regras claras para listar, consultar, atualizar e remover usuários.
- Aplicar escopo por papel para evitar vazamento entre organizações e restringir mutações administrativas.
- Paginar a listagem de usuários com o padrão já usado em outros módulos da API.
- Manter a criação de contas no fluxo existente de convites e autenticação, em vez de introduzir um onboarding paralelo em `/api/users`.

## Capabilities

### New Capabilities
- `user-management`: Define como a API administra usuários já provisionados, incluindo listagem paginada, detalhe, atualização e remoção com controle de escopo por papel.

### Modified Capabilities

## Impact

- Afeta `apps/api`, principalmente o módulo `users`, suas policies, schemas Zod, rotas e consultas ao banco.
- Impacta o documento OpenAPI e `packages/api-client`, já que o contrato de `/api/users` deixará de ser mockado e passará a expor endpoints de gestão real.
- Interage com autenticação e convites, porque o módulo passa a administrar usuários criados pelo fluxo `invite + Better Auth` sem duplicar o processo de criação de conta.

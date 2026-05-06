## 1. API user listing filters

- [x] 1.1 Estender `users.schemas.ts` e `users/routes.ts` para aceitar `search`, `role` e `organizationId` em `GET /api/users`
- [x] 1.2 Atualizar `get-users.ts` para aplicar escopo do ator, filtros opcionais e paginação sem quebrar os totais retornados
- [x] 1.3 Cobrir com testes da API os cenários de filtro por termo, papel e organização, incluindo a proteção de escopo para `organization_owner`

## 2. Client and route integration

- [x] 2.1 Regenerar `packages/api-client` para expor os novos parâmetros de listagem de usuários
- [x] 2.2 Registrar a rota `/app/admin/usuarios` no router web com proteção para `admin` e redirecionamento para a experiência de não autorizado
- [x] 2.3 Ajustar a navegação do app para exibir a entrada administrativa apenas para sessões `admin`

## 3. Admin user management page

- [x] 3.1 Criar o módulo `apps/web/src/modules/users` com a página administrativa e seus componentes locais
- [x] 3.2 Implementar tabela paginada, estados de loading/empty, mapeamento de papéis atuais e restauração de filtros pela URL
- [x] 3.3 Integrar o carregamento de organizações visíveis para preencher nomes e opções de filtro/formulário
- [x] 3.4 Implementar o fluxo de detalhe/edição de usuário e a ação de exclusão com confirmação explícita
- [x] 3.5 Implementar o CTA de criação de `organization_owner` por convite usando o endpoint existente de invites

## 4. Validation

- [x] 4.1 Adicionar ou atualizar testes web para proteção de rota, renderização com dados reais e restauração de filtros pela URL
- [x] 4.2 Executar as validações relevantes dos artefatos tocados, incluindo testes focados, typecheck e checagens de lint/formatação aplicáveis
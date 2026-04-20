## 1. Fechar leitura e contrato do módulo users

- [x] 1.1 Substituir `getUsers` e `getUser` por consultas reais à tabela `users`, com escopo correto para `admin` e `organization_owner`
- [x] 1.2 Adicionar paginação em `GET /api/users` com `page`, `pageSize`, `items`, `total` e `totalPages`
- [x] 1.3 Expandir os schemas Zod e o contrato HTTP do módulo `users` para refletir dados reais de administração

## 2. Implementar mutações administrativas

- [x] 2.1 Definir e aplicar policies de update/delete para distinguir permissões de `admin` e `organization_owner`
- [x] 2.2 Implementar `PATCH /api/users/:userId` com validação de campos permitidos e consistência entre `role` e `organizationId`
- [x] 2.3 Implementar `DELETE /api/users/:userId` para remoção autorizada de usuários já provisionados
- [x] 2.4 Registrar as novas rotas do módulo e deixar explícito que criação de conta continua fora de `/api/users`

## 3. Validar o módulo finalizado

- [x] 3.1 Cobrir com testes os cenários de listagem, detalhe, update e delete com escopo por papel
- [x] 3.2 Regenerar OpenAPI e `packages/api-client`, ajustando incompatibilidades de contrato se surgirem
- [x] 3.3 Executar as verificações relevantes dos pacotes afetados, incluindo lint e typecheck

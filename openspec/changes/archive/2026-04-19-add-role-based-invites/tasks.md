## 1. Modelagem de convites

- [x] 1.1 Adicionar a tabela `invites` no schema do banco com papel de destino, `organizationId`, convidador, status, expiração e token de resgate
- [x] 1.2 Gerar a migration e ajustar exports/tipos compartilhados para o novo modelo de convites

## 2. Módulo de invites na API

- [x] 2.1 Implementar policies e serviços de criação/listagem de convites com as regras `admin -> organization_owner` e `organization_owner -> member`
- [x] 2.2 Criar schemas Zod e rotas Fastify para criar convites, listar convites visíveis e consultar um convite pendente por token
- [x] 2.3 Implementar o fluxo de aceite do convite com validação de token, conferência de e-mail da sessão e atualização transacional de `users.role` e `users.organizationId`
- [x] 2.4 Registrar o módulo `invites` no bootstrap da API e garantir que o contrato OpenAPI exponha as novas rotas

## 3. Verificação do fluxo

- [x] 3.1 Cobrir com testes os cenários de criação por `admin` e `organization_owner`, incluindo escopo de visualização dos convites
- [x] 3.2 Cobrir com testes o aceite bem-sucedido e as rejeições por token expirado, convite já consumido e e-mail divergente
- [x] 3.3 Regenerar os contratos afetados e executar as verificações relevantes da API, incluindo lint e typecheck

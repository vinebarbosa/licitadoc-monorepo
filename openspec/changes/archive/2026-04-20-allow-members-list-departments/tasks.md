## 1. Authorization Update

- [x] 1.1 Atualizar `canListDepartments()` para permitir que atores `member` acessem a listagem
- [x] 1.2 Garantir que a listagem continue usando o escopo organizacional existente para restringir `member` e `organization_owner` `GET /departments`

## 2. Verification

- [x] 2.1 Ajustar os testes de `departments` para cobrir listagem bem-sucedida de `member` na própria organização
- [x] 2.2 Cobrir em teste o comportamento de página vazia para ator não admin sem `organizationId`
- [x] 2.3 Executar as verificações relevantes do módulo afetado

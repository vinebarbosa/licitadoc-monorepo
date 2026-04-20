## 1. Data Model

- [x] 1.1 Atualizar o schema `departments` para manter `slug` e adicionar `responsibleName` e `responsibleRole`, preservando `id` e `organizationId`
- [x] 1.2 Gerar a migration correspondente para alinhar a tabela `departments` ao novo modelo

## 2. Department Module

- [x] 2.1 Criar o módulo `departments` com schemas Zod e serialização do contrato de `id`, `name`, `slug`, `organizationId`, `responsibleName`, `responsibleRole`, `createdAt` e `updatedAt`
- [x] 2.2 Implementar `POST /api/departments` com regras de criação para `admin` e `organization_owner` e bloqueio para `member`
- [x] 2.3 Implementar `GET /api/departments` paginado com escopo global para `admin` e escopo por organização para `organization_owner`
- [x] 2.4 Implementar `GET /api/departments/:departmentId` com leitura real e restrição por visibilidade organizacional
- [x] 2.5 Implementar `PATCH /api/departments/:departmentId` permitindo editar `name`, `slug`, `responsibleName` e `responsibleRole`, sem mover o departamento para outra organização
- [x] 2.6 Registrar o módulo no app/OpenAPI e manter exclusão de departments fora desta change

## 3. Verification

- [x] 3.1 Cobrir com testes os cenários de create, list, detail e update com escopo por papel, validação de `responsibleName` e `responsibleRole`, e conflito de `slug` por organização
- [x] 3.2 Regenerar OpenAPI e `packages/api-client` para incluir o contrato de departments
- [x] 3.3 Executar lint, typecheck e testes dos pacotes afetados

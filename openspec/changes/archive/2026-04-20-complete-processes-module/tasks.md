## 1. Expandir o modelo de dados de processos

- [x] 1.1 Atualizar o schema `processes` para substituir `title` pelo perfil do processo com `type`, `processNumber`, `externalId`, `issuedAt`, `object`, `justification` e `responsibleName`, preservando `id`, `organizationId`, `status`, `createdAt` e `updatedAt`
- [x] 1.2 Adicionar a constraint de unicidade de `processNumber` por organização e gerar a migration correspondente sem quebrar a relação existente com `documents.processId` nem `process_departments`
- [x] 1.3 Definir a estratégia de serialização e validação de `departmentIds` reaproveitando a tabela `process_departments`, sem duplicar a relação de documentos dentro de `processes`

## 2. Implementar o módulo `processes`

- [x] 2.1 Expandir os schemas Zod e o contrato HTTP do módulo `processes` para refletir o novo modelo, a paginação administrativa e o `externalId` opcional
- [x] 2.2 Implementar `POST /api/processes` com escopo por papel, validação de organização, unicidade de `processNumber` e vínculo transacional com departamentos
- [x] 2.3 Implementar `GET /api/processes` paginado com visibilidade global para `admin`, escopo por organização para `organization_owner` e `member`, e resposta vazia para não-admin sem organização
- [x] 2.4 Implementar `GET /api/processes/:processId` com leitura real e restrição por visibilidade organizacional, preservando a compatibilidade com documentos já vinculados ao processo
- [x] 2.5 Implementar `PATCH /api/processes/:processId` com persistência dos campos permitidos, sincronização transacional de `departmentIds` e atualização de `updatedAt`, sem quebrar os documentos relacionados
- [x] 2.6 Ajustar policies, helpers compartilhados e registro de rotas para substituir os placeholders atuais pelo módulo finalizado

## 3. Validar o contrato final

- [x] 3.1 Cobrir com testes os cenários de create, list, detail e update com escopo por papel, conflito de `processNumber`, rejeição de departamentos fora da organização e preservação dos documentos já ligados ao processo
- [x] 3.2 Regenerar OpenAPI e `packages/api-client` para incluir o contrato final de `processes`
- [x] 3.3 Executar as verificações relevantes dos pacotes afetados, incluindo testes, lint e typecheck

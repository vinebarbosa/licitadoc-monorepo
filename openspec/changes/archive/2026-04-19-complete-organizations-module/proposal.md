## Why

O módulo `organizations` ainda está incompleto em dois pontos centrais: a tabela não representa os dados institucionais reais de uma prefeitura e a API não fecha o fluxo de onboarding de quem entra no sistema como `organization_owner`, mas ainda sem organização vinculada. Isso bloqueia a entrada do administrador da prefeitura, porque hoje não existe um caminho confiável para cadastrar a prefeitura e vinculá-la ao próprio usuário.

## What Changes

- Expandir o modelo de `organizations` para refletir os dados institucionais da prefeitura, incluindo `officialName`, `cnpj`, `city`, `state`, `address`, `zipCode`, `phone`, `institutionalEmail`, `website`, `logoUrl`, `authorityName`, `authorityRole`, `isActive` e `createdByUserId`.
- Substituir `GET /api/organizations/:organizationId` e `PATCH /api/organizations/:organizationId` por consultas e mutações reais na tabela `organizations`.
- Adicionar listagem paginada em `GET /api/organizations` para gestão das prefeituras persistidas.
- Redefinir `POST /api/organizations` como fluxo de onboarding: um usuário autenticado com `role = organization_owner` e sem organização informa os dados da prefeitura, o sistema cria a organização e o vincula a ela.
- Aplicar escopo por papel para que `admin` administre todas as organizações, `organization_owner` gerencie apenas a própria organização e `member` não use as rotas administrativas do módulo.
- Manter exclusão de organizações fora desta change, evitando introduzir uma regra destrutiva antes de definir o comportamento sobre usuários, convites, departamentos, processos e documentos relacionados.

## Capabilities

### New Capabilities
- `organization-management`: Define como a API cria, lista, consulta e atualiza organizações que representam prefeituras, incluindo o onboarding que vincula a organização ao próprio `organization_owner` criador.

### Modified Capabilities

## Impact

- Afeta `apps/api`, principalmente o schema da tabela `organizations`, suas migrations, policies, schemas Zod, rotas e consultas ao banco.
- Impacta autenticação e usuários, porque a criação da organização passa a preencher `users.organizationId` do `organization_owner` autenticado e registrar esse usuário em `createdByUserId`.
- Impacta o documento OpenAPI e `packages/api-client`, já que o contrato de `/api/organizations` deixará de ser parcial e passará a expor o fluxo real de onboarding e gestão.

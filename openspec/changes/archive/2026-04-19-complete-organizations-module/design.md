## Context

O módulo `organizations` em `apps/api` ainda está em estado parcial. Hoje `GET /api/organizations/:organizationId` e `PATCH /api/organizations/:organizationId` retornam placeholders, a tabela `organizations` armazena apenas `name` e `slug`, e o sistema não possui um fluxo completo para quando um usuário autenticado entra como `organization_owner`, mas ainda sem organização vinculada, e precisa cadastrar a prefeitura que vai administrar.

Esse ponto ficou mais importante depois da evolução de convites e usuários: o domínio já assume que `organization_owner` e `member` pertencem a uma única organização, e que uma organização concentra usuários, departamentos e processos. Se a organização representa uma prefeitura, então o módulo precisa armazenar seus dados institucionais completos e fechar o onboarding do próprio `organization_owner` que vai administrá-la.

## Goals / Non-Goals

**Goals:**
- Expandir o schema de `organizations` para o modelo institucional da prefeitura.
- Expor listagem paginada, detalhe e atualização reais de organizações persistidas.
- Implementar a criação da organização como um fluxo transacional de onboarding para `organization_owner` autenticado sem organização.
- Aplicar escopo claro por papel e alinhar o contrato OpenAPI e o `api-client` ao módulo finalizado.

**Non-Goals:**
- Implementar exclusão de organizações nesta change.
- Introduzir suporte a múltiplas organizações por usuário.
- Remodelar outros módulos do domínio além do necessário para vincular o criador à nova organização.

## Decisions

### 1. A tabela `organizations` será expandida para representar uma prefeitura

O schema atual deve ser ampliado para armazenar os dados institucionais necessários do domínio:
- identificação: `id`, `name`, `slug`;
- perfil institucional: `officialName`, `cnpj`, `city`, `state`, `address`, `zipCode`, `phone`, `institutionalEmail`, `website`, `logoUrl`;
- autoridade principal: `authorityName`, `authorityRole`;
- controle: `isActive`, `createdByUserId`, `createdAt`, `updatedAt`.

`slug` continua sendo identificador amigável único. `cnpj` deve ser tratado como identificador institucional único da prefeitura. `isActive` deve nascer com `true`. `createdByUserId` deve registrar quem concluiu o onboarding da organização.

Alternativas consideradas:
- Manter a tabela minimalista e guardar o restante em outra entidade: adiciona complexidade sem necessidade, já que todos os campos pertencem à identidade da prefeitura.
- Adiar o enriquecimento do schema para depois do frontend: mantém o módulo incompleto e posterga um contrato essencial do domínio.

### 2. A criação da organização acontece no onboarding do `organization_owner` sem organização

`POST /api/organizations` deve ser reposicionado como fluxo de onboarding, não como simples criação administrativa global. O endpoint deve aceitar um usuário autenticado cujo `organizationId` ainda seja `null`. Em uma transação:
1. o sistema cria a organização com os dados da prefeitura;
2. registra `createdByUserId` com o usuário autenticado;
3. garante que o usuário permanece com `role = organization_owner`;
4. preenche `users.organizationId` com a nova organização.

Essa decisão impede que a organização seja criada sem dono e garante consistência imediata entre `organizations` e `users`, sem transformar o onboarding em uma promoção de papel.

Alternativas consideradas:
- Permitir criação por `admin` global para qualquer organização: não atende o fluxo de onboarding descrito e não resolve o caso do usuário que entra sem organização.
- Criar a organização e vincular o usuário em passos separados: aumenta risco de inconsistência se uma etapa falhar.

### 3. Escopo por papel será dividido entre onboarding e gestão administrativa

As regras do módulo devem separar criação por onboarding das demais operações:
- um usuário autenticado com `role = organization_owner` e sem organização pode concluir o onboarding de criação;
- `admin` pode listar, ler e atualizar qualquer organização;
- `organization_owner` pode listar, ler e atualizar apenas a própria organização;
- `member` não acessa as rotas administrativas do módulo.

Para listagem, `admin` vê todas as organizações de forma paginada; `organization_owner` vê apenas a própria; um ator sem organização recebe comportamento compatível com onboarding, não com gestão.

Alternativas consideradas:
- Permitir que `member` leia a própria organização por estas rotas: pode ser útil no futuro, mas mistura consulta operacional com módulo administrativo.
- Permitir que `organization_owner` crie múltiplas organizações: conflita com a regra de uma organização por usuário.

### 4. Campos e mutações administrativas terão tratamento explícito

O contrato HTTP deve expor os campos institucionais reais da organização. Para mutação:
- `createdByUserId`, `createdAt` e `updatedAt` são sempre controlados pelo sistema;
- `isActive` deve ser administrável apenas por `admin`, por ser um campo de governança/lifecycle;
- `organization_owner` pode editar apenas o perfil institucional da própria prefeitura;
- conflitos de unicidade em `slug` ou `cnpj` devem ser traduzidos em erro de domínio previsível.

`logoUrl` e `website` podem ser opcionais por serem complementares ao perfil institucional; os demais campos do cadastro institucional devem ser tratados como parte do onboarding principal.

Alternativas consideradas:
- Liberar `isActive` para `organization_owner`: aumenta risco de desativação indevida da própria organização.
- Expor `createdByUserId` como campo editável: descaracteriza a trilha de auditoria da criação.

### 5. `createdByUserId` será persistido como campo de proveniência do onboarding

Como a tabela `users` já referencia `organizations`, a inclusão de `createdByUserId` precisa ser implementada com cuidado para não complicar o acoplamento entre schemas. A change deve tratar esse campo como dado de proveniência do criador e preenchê-lo a partir do usuário autenticado no momento da criação, mantendo o valor estável depois disso.

Alternativas consideradas:
- Omitir o campo: perde um dado importante de auditoria do onboarding.
- Deixar o campo solto sem preenchimento sistemático: reduz valor operacional e rastreabilidade.

## Risks / Trade-offs

- **[Onboarding criar organização sem vincular o usuário]** -> Mitigar fazendo criação da organização e update do `organizationId` do usuário na mesma transação.
- **[Conflitos de unicidade em `slug` ou `cnpj`]** -> Mitigar com normalização, índices únicos e tradução para erro de conflito.
- **[Campo `isActive` gerar ambiguidade de permissão]** -> Mitigar reservando sua alteração ao `admin`.
- **[Mudança de schema ampliar impacto em contratos e testes]** -> Mitigar atualizando OpenAPI, `api-client` e cobrindo os cenários principais do onboarding e do escopo por papel.

## Migration Plan

1. Expandir o schema de `organizations` e gerar a migration correspondente.
2. Implementar serializers, policies e consultas reais de listagem/detalhe.
3. Implementar o fluxo transacional de criação por onboarding e o update administrativo.
4. Regenerar OpenAPI e `packages/api-client`.
5. Executar testes, lint e typecheck dos pacotes afetados.

Rollback:
- Reverter a migration da tabela `organizations`.
- Restaurar os handlers atuais do módulo.
- Regenerar OpenAPI e cliente com o contrato anterior.

## Open Questions

Nenhuma aberta no momento. Esta change assume que `logoUrl` e `website` podem ser opcionais, que `isActive` nasce como `true`, e que exclusão de organizações continuará fora do escopo até existir uma regra de domínio explícita para os dados relacionados.

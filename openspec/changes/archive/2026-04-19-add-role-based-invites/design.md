## Context

Hoje a API expõe leitura de usuários e organizações, mas ainda não possui um fluxo de provisionamento controlado para novos acessos. O arquivo `apps/api/src/modules/users/create-user.ts` continua sem implementação, `buildApp()` não registra nenhuma rota de convites e o cadastro público do Better Auth aceita apenas `name`, `email` e `password`, mantendo `role` e `organizationId` como campos internos.

Ao mesmo tempo, a autorização do sistema já depende de `role` e `organizationId` no registro de `users`. Isso significa que o módulo administrativo precisa de um caminho explícito para decidir quem pode convidar, qual papel o convidado receberá e quando a organização deve ser vinculada ao usuário.

## Goals / Non-Goals

**Goals:**
- Introduzir um fluxo backend de convites para onboarding de `organization_owner` e `member`.
- Persistir no convite o contexto aprovado de provisionamento, incluindo papel e organização quando existir.
- Reaproveitar o Better Auth para criação de credenciais e sessão, evitando duplicar a lógica de autenticação.
- Garantir regras claras de autorização para criação, visualização e aceite de convites.

**Non-Goals:**
- Integrar envio de e-mail transacional nesta change.
- Construir toda a interface administrativa em `apps/web`, que hoje ainda está mínima.
- Permitir convites para `admin` ou criar um sistema genérico de mudança de papel fora do fluxo de invites.

## Decisions

### 1. Modelar convites em uma tabela dedicada

A change deve introduzir uma tabela `invites` própria, separada das tabelas do Better Auth. Essa tabela precisa guardar, no mínimo, o e-mail normalizado do convidado, o papel de destino, `organizationId` opcional, o usuário que convidou, status do convite, expiração, metadados de aceite e uma referência segura ao token de resgate.

Isso atende ao requisito de auditoria e garante que o sistema aplique exatamente o papel aprovado no momento da criação do convite. Também evita depender da tabela `verifications`, que hoje é genérica demais para consultas administrativas e não guarda o contexto de autorização do convite.

Alternativas consideradas:
- Reusar `verifications`: simplifica a persistência inicial, mas não atende bem a listagem administrativa nem ao requisito de armazenar papel e organização de forma explícita.
- Guardar apenas um token bruto e resolver o resto em memória: perde auditabilidade e dificulta impedir reuso ou listar convites pendentes.

### 2. Manter o cadastro de credenciais no Better Auth e tratar o invite como ativação de acesso

Em vez de criar um endpoint próprio de sign-up, o fluxo deve continuar usando o cadastro/autenticação já oferecido por `/api/auth`. O módulo de invites passa a cuidar de duas etapas:
- validar e expor o resumo de um convite pendente;
- aplicar o `role` e o `organizationId` armazenados no convite quando um usuário autenticado, com o mesmo e-mail, aceitar esse convite.

Essa abordagem reduz o risco de duplicar criação de senha, sessão, cookies e validações já resolvidas pelo Better Auth. Também encaixa naturalmente com `getSessionUser()`, porque o aceite acontece quando já existe uma sessão autenticada.

Alternativas consideradas:
- Implementar um sign-up paralelo dentro de `apps/api`: aumenta o acoplamento com detalhes internos de autenticação e tende a duplicar regras de segurança.
- Ativar o plugin administrativo do Better Auth para o aceite do convidado: o plugin é voltado a ações administrativas, não ao resgate self-service de um convite.

### 3. Derivar papel e organização do convite a partir do papel do convidador

As regras de negócio devem ser aplicadas na criação do convite:
- `admin` só pode criar convite com papel `organization_owner`, com `organizationId` opcional;
- `organization_owner` só pode criar convite com papel `member`, sempre reaproveitando a própria `organizationId`;
- `member` não pode criar convites.

O papel efetivamente salvo no convite será o mesmo papel aplicado no aceite. Isso satisfaz a necessidade de manter o `role` escolhido/aprovado dentro da tabela de invites e evita divergência entre a intenção administrativa e o resultado final no usuário.

Alternativas consideradas:
- Permitir que o cliente envie qualquer `role`: viola as regras descritas para o módulo administrativo e torna a policy mais frágil.
- Inferir o papel apenas no momento do aceite: perde rastreabilidade do que foi aprovado quando o convite foi emitido.

### 4. Expor um módulo `invites` dedicado na API

A API deve ganhar um módulo próprio em `apps/api/src/modules/invites`, com policies, schemas Zod, serviços e rotas registradas no bootstrap. O conjunto mínimo de operações é:
- criar convite autenticado;
- listar convites visíveis para o ator atual;
- consultar um convite pendente por token para montar a tela de aceite;
- aceitar convite válido e pendente.

Separar `invites` de `users` mantém o domínio de provisionamento isolado do domínio de leitura/gestão de usuários já existentes. Como a API já usa `fastify-zod-openapi`, o novo módulo deve seguir o mesmo padrão para manter OpenAPI e cliente gerado coerentes.

Alternativas consideradas:
- Colocar o fluxo em `users`: mistura o cadastro pretendido com a entidade já provisionada.
- Esconder tudo atrás das rotas proxied do Better Auth: o comportamento é de negócio da aplicação, não do provedor de autenticação.

## Risks / Trade-offs

- **[Onboarding em duas etapas: autenticar e depois aceitar]** -> Mitigar com um endpoint de preview do convite e com respostas que orientem claramente o frontend sobre o próximo passo.
- **[Reuso ou corrida no mesmo token]** -> Mitigar com atualização transacional do status do convite, aceitando apenas registros `pending` ainda válidos.
- **[Aceite por usuário já existente em estado conflitante]** -> Mitigar validando e-mail e bloqueando transições incompatíveis antes de atualizar `users`.
- **[Ausência de envio automático de e-mail]** -> Mitigar retornando o token ou link de resgate no create, permitindo distribuição manual enquanto a camada de notificações não existe.

## Migration Plan

1. Adicionar schema e migration da tabela `invites`, incluindo índices para e-mail, status e organização.
2. Implementar o módulo `invites` na API com routes, policies, schemas e serviços de criação/listagem/preview/aceite.
3. Registrar o módulo no bootstrap da aplicação e atualizar o contrato OpenAPI se novas rotas forem expostas publicamente.
4. Cobrir o fluxo com testes de autorização e de aceite, incluindo expiração, e-mail divergente e vínculo de organização.

Rollback:
- Remover o registro das rotas de invites.
- Reverter a migration e o schema da tabela `invites`.
- Regenerar os contratos caso as rotas já tenham sido exportadas para o cliente.

## Open Questions

Nenhuma aberta no momento. Esta change assume validade padrão configurável para convites e permite aceite por qualquer conta autenticada cujo e-mail corresponda ao convite pendente.

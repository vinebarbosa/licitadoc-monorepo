## Context

O módulo `users` em `apps/api` ainda está em estado parcial. Hoje `GET /api/users` e `GET /api/users/:userId` retornam dados mockados, não usam a tabela `users` e não aplicam escopo real por organização. Além disso, `create-user.ts`, `update-user.ts` e `delete-user.ts` continuam sem implementação, enquanto o bootstrap só registra rotas de leitura.

Ao mesmo tempo, o sistema já possui dois fluxos relacionados que delimitam bem o papel do módulo:
- o Better Auth continua responsável por autenticação, credenciais e operações self-service de conta;
- o módulo `invites` já passou a ser o caminho de provisionamento administrativo para novos acessos.

Isso sugere que “finalizar o módulo usuário” deve significar fechar a gestão de usuários já provisionados, e não criar um segundo fluxo de onboarding em paralelo.

## Goals / Non-Goals

**Goals:**
- Substituir os retornos mockados do módulo `users` por consultas reais ao banco.
- Expor listagem paginada e detalhe de usuários com escopo correto por papel.
- Implementar atualização e remoção de usuários com regras administrativas explícitas.
- Manter o contrato OpenAPI e o cliente gerado alinhados ao módulo finalizado.

**Non-Goals:**
- Criar um novo fluxo de criação de conta em `/api/users`.
- Substituir endpoints self-service já cobertos pelo Better Auth.
- Alterar o schema do banco para usuários nesta change.

## Decisions

### 1. O módulo `users` gerencia usuários existentes; criação continua em `invites + auth`

O módulo `users` deve assumir explicitamente a gestão de usuários já provisionados. A criação de novos acessos continua a acontecer via convite administrativo e cadastro/autenticação do Better Auth.

Isso evita duplicar regras de onboarding e mantém uma separação clara entre:
- provisionamento de acesso, que já foi resolvido em `invites`;
- manutenção administrativa de usuários, que é a responsabilidade do módulo `users`.

Alternativas consideradas:
- Implementar `POST /api/users` para criar contas diretamente: cria um segundo caminho de onboarding e entra em conflito com o fluxo recém-definido de convites.

### 2. Ler e mutar usuários diretamente pela tabela `users`, com paginação compartilhada

Listagem e detalhe devem consultar diretamente a tabela `users` via Drizzle. A listagem deve reutilizar `normalizePagination()` para aceitar `page` e `pageSize`, aplicar `limit/offset` e retornar metadados paginados.

Essa escolha mantém o módulo consistente com `invites`, evita depender do plugin admin do Better Auth e usa a modelagem já persistida pela aplicação como fonte de verdade.

Alternativas consideradas:
- Habilitar o plugin admin do Better Auth para listagem e mutação: aumenta a superfície da integração e desloca regras de escopo da aplicação para um plugin não adotado hoje.

### 3. Aplicar escopo e mutações por papel de forma explícita

As regras do módulo devem ser centralizadas em policies:
- `admin` pode listar, ler, atualizar e remover qualquer usuário;
- `organization_owner` pode listar e ler apenas usuários da própria organização;
- `organization_owner` pode atualizar ou remover apenas usuários `member` da própria organização;
- `member` não acessa o módulo administrativo de usuários.

Isso preserva a hierarquia já implícita no sistema: admins criam owners, owners convidam members e owners não administram usuários mais privilegiados do que eles.

Alternativas consideradas:
- Permitir que `organization_owner` altere outros owners: aumenta risco de escalonamento lateral dentro da organização.
- Permitir mutações para `member`: conflita com o caráter administrativo do módulo.

### 4. Expandir o contrato de usuário para dados reais de administração

O contrato HTTP do módulo deve deixar de expor só `id`, `email` e `role`, passando a refletir dados reais úteis para gestão, como `name`, `organizationId`, `emailVerified`, timestamps e, no detalhe, os campos relevantes para administração.

Para mutação, o contrato deve permitir apenas campos coerentes com a política escolhida, como `name`, `role` e `organizationId`, validando consistência entre papel e organização.

Alternativas consideradas:
- Manter o contrato mínimo atual: empobrece demais o módulo e força o frontend a consultar outras fontes para uma tela administrativa simples.

## Risks / Trade-offs

- **[Vazamento entre organizações por filtro incorreto]** -> Mitigar compartilhando predicates de escopo entre listagem, detalhe, update e delete.
- **[Mudanças de papel/organização incoerentes]** -> Mitigar validando combinações permitidas antes de persistir e reaproveitando as regras de role já usadas no domínio.
- **[Conflito conceitual entre `users` e `invites`]** -> Mitigar declarando explicitamente que criação de conta permanece fora de `/api/users`.
- **[Remoção direta de usuário afetar autenticação]** -> Mitigar usando o comportamento de cascata já presente nas relações de `users`, `sessions` e `accounts`, e cobrindo isso com testes de módulo.

## Migration Plan

1. Implementar policies e consultas reais de listagem/detalhe no módulo `users`.
2. Adicionar contratos e rotas de update/delete coerentes com o escopo por papel.
3. Regenerar OpenAPI e `packages/api-client`.
4. Executar testes, lint e typecheck dos pacotes afetados.

Rollback:
- Restaurar as rotas e handlers atuais do módulo `users`.
- Regenerar OpenAPI e cliente com o contrato anterior.

## Open Questions

Nenhuma aberta no momento. Esta change assume que a criação de novos usuários continuará no fluxo de convites, e que o módulo `users` fecha o ciclo de administração dos usuários já existentes.

## Context

O módulo `departments` já implementa listagem paginada com escopo por organização através de `getDepartmentsVisibilityScope(actor)`. Na prática, esse helper já limita qualquer ator não admin ao próprio `organizationId` e o serviço já devolve uma página vazia quando o ator não admin não possui escopo organizacional.

O bloqueio atual acontece antes disso, em `canListDepartments(actor)`, que só autoriza `admin` e `organization_owner`. Isso faz com que `member` seja barrado mesmo quando pertence a uma organização e deveria apenas consultar o diretório de departamentos dessa organização.

Esta change refina a regra de autorização da listagem sem alterar a modelagem de dados, sem mudar o contrato paginado e sem expandir poderes administrativos de `member`.

## Goals / Non-Goals

**Goals:**
- Permitir que `member` liste departamentos da própria organização.
- Manter `admin` com visibilidade global e `organization_owner` com visibilidade restrita à própria organização.
- Preservar o comportamento de resposta paginada vazia para atores não admin sem `organizationId`.
- Cobrir a nova regra com testes no módulo de departamentos.

**Non-Goals:**
- Permitir que `member` crie ou atualize departamentos.
- Alterar a visibilidade de leitura detalhada em `GET /departments/:departmentId`.
- Mudar schemas, paginação, payloads ou acesso ao banco além do necessário para a autorização da listagem.

## Decisions

### 1. Ampliar apenas a autorização de listagem

`canListDepartments(actor)` passará a aceitar `member`, mas as regras de criação, atualização e leitura detalhada permanecem como estão.

Isso corrige o desvio de negócio apontado pelo usuário sem expandir o conceito de "gerenciar departamentos" para papéis que não devem administrar cadastro.

Alternativas consideradas:
- Permitir também leitura detalhada para `member`: deixaria a experiência mais simétrica, mas amplia o escopo além da correção solicitada.
- Criar um novo papel ou permissão granular para diretório: adicionaria complexidade desnecessária para um caso que já cabe na modelagem atual de papéis.

### 2. Reutilizar o escopo organizacional já existente

A listagem continuará dependendo de `getDepartmentsVisibilityScope(actor)` e da proteção já existente que retorna página vazia para atores não admin sem `organizationId`.

Isso evita duplicar regras para `member` e mantém um único ponto de decisão para o filtro organizacional da consulta.

Alternativas consideradas:
- Adicionar um branch específico para `member` em `getDepartments()`: funcionaria, mas espalharia a mesma regra entre policy e serviço.

### 3. Validar a mudança com testes orientados a papel e escopo

Os testes de `departments` devem incluir o caso de sucesso para `member` com `organizationId` e o caso vazio para ator não admin sem organização, preservando os cenários atuais de `admin` e `organization_owner`.

Isso protege a correção de regressões futuras e documenta o comportamento esperado diretamente no módulo afetado.

Alternativas consideradas:
- Confiar apenas nos testes existentes de `organization_owner`: não captura a nova permissão de `member`.

## Risks / Trade-offs

- **[`member` lista, mas não lê detalhe]** -> Mitigar documentando explicitamente no spec e mantendo a change focada em `GET /departments`.
- **[Regra de visibilidade espalhada entre policy e serviço]** -> Mitigar mantendo a policy responsável apenas por autorização de entrada e o helper compartilhado responsável pelo filtro por organização.
- **[Regressão em cenários sem `organizationId`]** -> Mitigar cobrindo em teste a resposta paginada vazia para atores não admin sem organização.

## Migration Plan

1. Atualizar a policy de listagem para aceitar `member`.
2. Ajustar ou expandir os testes do módulo `departments` para cobrir o novo comportamento.
3. Executar as verificações relevantes do pacote afetado.

Rollback:
- Restaurar a policy anterior que restringe a listagem a `admin` e `organization_owner`.
- Reverter os testes para o comportamento anterior.

## Open Questions

Nenhuma no momento. Esta change assume que a necessidade atual é apenas permitir a descoberta de departamentos via listagem, sem expandir leitura detalhada para `member`.

# Especificação de Arquitetura da API

## Objetivo

Definir uma arquitetura simples, modular e evolutiva para o backend do monorepo, usando:

- Fastify
- Better Auth
- Drizzle ORM
- PostgreSQL
- arquitetura funcional por caso de uso

O objetivo é começar com baixa complexidade, sem camadas artificiais de `service` e `repository`, mas mantendo organização suficiente para crescer sem reescrita.

## Princípios

- Organização por módulo de negócio.
- Uma função por caso de uso.
- Rotas responsáveis apenas por HTTP.
- Casos de uso podem acessar o banco diretamente via Drizzle.
- Autorização explícita e próxima do domínio.
- Schemas como contrato de entrada e saída.
- Extração de camadas adicionais apenas quando houver dor real.

## Estrutura da API

```text
apps/api/
  src/
    app/
      build-app.ts
      server.ts

    plugins/
      env.ts
      db.ts
      auth.ts
      cors.ts
      errors.ts
      security.ts

    authorization/
      roles.ts
      actor.ts

    modules/
      auth/
        routes.ts

      users/
        routes.ts
        get-user.ts
        get-users.ts
        create-user.ts
        update-user.ts
        delete-user.ts
        users.schemas.ts
        users.policies.ts

      organizations/
        routes.ts
        get-organization.ts
        update-organization.ts
        organizations.schemas.ts
        organizations.policies.ts

      processes/
        routes.ts
        get-process.ts
        get-processes.ts
        create-process.ts
        update-process.ts
        delete-process.ts
        processes.schemas.ts
        processes.policies.ts

      documents/
        routes.ts
        get-document.ts
        get-documents.ts
        create-document.ts
        update-document.ts
        delete-document.ts
        documents.schemas.ts
        documents.policies.ts

    db/
      index.ts
      schema/
        auth.ts
        users.ts
        organizations.ts
        processes.ts
        documents.ts
      migrations/

    shared/
      auth/
        get-session-user.ts
        require-auth.ts
        require-admin.ts
      errors/
        app-error.ts
        unauthorized-error.ts
        forbidden-error.ts
        not-found-error.ts
      http/
        pagination.ts
      utils/
        dates.ts
        strings.ts
```

## Responsabilidade de cada área

### `app/`

Responsável por compor e subir a aplicação.

- `build-app.ts`: cria a instância do Fastify, registra plugins e módulos.
- `server.ts`: inicializa o servidor HTTP.

### `plugins/`

Responsável por infraestrutura transversal.

- `env.ts`: valida e expõe variáveis de ambiente.
- `db.ts`: registra a instância do Drizzle no Fastify.
- `auth.ts`: integra Better Auth.
- `cors.ts`: configura CORS, cookies e `trustedOrigins`.
- `errors.ts`: registra o error handler global.
- `security.ts`: headers, hardening e proteções globais.

### `authorization/`

Responsável apenas pelos conceitos globais de autorização.

- `roles.ts`: define os papéis do sistema.
- `actor.ts`: define a estrutura do usuário autenticado usada nas policies.

As regras de autorização específicas ficam dentro dos módulos, e não centralizadas aqui.

### `modules/`

É a camada principal de negócio.

Cada módulo representa um domínio do sistema. Cada arquivo de caso de uso representa uma ação de negócio.

Exemplo no módulo `users`:

- `routes.ts`: registra as rotas do módulo.
- `get-user.ts`: caso de uso para obter um usuário.
- `create-user.ts`: caso de uso para criação de usuário.
- `users.schemas.ts`: schemas de entrada e saída.
- `users.policies.ts`: regras de acesso do módulo.

### `db/`

Responsável pela persistência.

- `schema/`: tabelas e relações do Drizzle.
- `migrations/`: arquivos gerados pelo `drizzle-kit`.
- `index.ts`: instanciação e export do banco.

### `shared/`

Responsável por código realmente compartilhado.

- autenticação reutilizável em hooks/pre-handlers;
- erros base da aplicação;
- helpers HTTP;
- utilitários genéricos.

`shared/` não deve conter regras de negócio específicas de módulo.

## Padrão de módulo

Cada módulo deve seguir este formato:

```text
modules/<module>/
  routes.ts
  <use-case>.ts
  <module>.schemas.ts
  <module>.policies.ts
```

Exemplo:

```text
modules/documents/
  routes.ts
  get-document.ts
  get-documents.ts
  create-document.ts
  update-document.ts
  delete-document.ts
  documents.schemas.ts
  documents.policies.ts
```

## Responsabilidade por arquivo

### `routes.ts`

- define endpoints;
- conecta schemas;
- executa `preHandler` quando necessário;
- pega o usuário autenticado;
- chama o caso de uso;
- traduz o retorno para resposta HTTP.

`routes.ts` não deve conter regra de negócio complexa nem query direta no banco.

### `<use-case>.ts`

- representa uma ação de negócio;
- pode consultar o banco diretamente com Drizzle;
- aplica validações de negócio;
- usa policies do módulo quando necessário;
- retorna dados ou lança erros de aplicação.

### `<module>.schemas.ts`

- define schema de `params`, `query`, `body` e `response`;
- funciona como contrato da operação;
- substitui a necessidade de DTO separado no início.

### `<module>.policies.ts`

- define quem pode executar ações naquele módulo;
- recebe o `actor` autenticado e o contexto do recurso;
- não conhece Fastify nem resposta HTTP.

## Fluxo de request

Fluxo padrão:

1. A request entra no Fastify.
2. A rota valida os dados com schema.
3. Um `preHandler` opcional autentica a request.
4. A rota obtém o `actor` autenticado.
5. A rota chama o caso de uso.
6. O caso de uso consulta o banco e aplica policies.
7. O caso de uso retorna dados ou lança erro.
8. O error handler global converte isso em resposta HTTP.

## Autenticação

A autenticação será feita com Better Auth.

Regras:

- sessão controlada pelo Better Auth;
- integração isolada no plugin `auth.ts`;
- leitura do usuário autenticado em `shared/auth/get-session-user.ts`;
- proteção de rotas por `preHandler`, como `require-auth.ts`.

O módulo `auth/` fica responsável pelas rotas específicas de autenticação.

## Autorização

Não será usada uma biblioteca de permissões no início.

A autorização será feita com funções próprias, simples e explícitas.

### Roles

As roles do sistema são:

- `admin`
- `organization_owner`
- `member`

### Regra de negócio das roles

#### `admin`

- possui acesso total ao sistema;
- pode gerenciar qualquer organização;
- pode gerenciar qualquer usuário;
- pode gerenciar qualquer processo;
- pode gerenciar qualquer documento.

#### `organization_owner`

- possui acesso apenas à própria organização;
- pode visualizar e atualizar os dados da própria organização;
- pode criar, visualizar, atualizar e excluir usuários da própria organização;
- pode criar, visualizar, atualizar e excluir processos da própria organização;
- pode criar, visualizar, atualizar e excluir documentos da própria organização.

#### `member`

- possui acesso apenas à própria organização;
- pode criar, visualizar, atualizar e excluir processos da própria organização;
- pode criar, visualizar, atualizar e excluir documentos da própria organização;
- não pode visualizar dados institucionais da organização além do necessário para operação;
- não pode atualizar dados institucionais da organização;
- não pode gerenciar usuários.

## Domínio principal

### Organização

Representa a estrutura institucional da empresa/cliente.

Exemplos de dados:

- nome
- slug
- plano
- billing
- CNPJ
- endereço
- configurações
- status

### Usuários

Representam as pessoas com acesso à plataforma e vinculadas a uma organização.

### Processos

Representam recursos operacionais da organização.

Cada processo pertence a uma organização.

### Documentos

Representam arquivos ou registros vinculados a um processo.

Cada documento:

- pertence a uma organização;
- pertence a um processo.

## Relações entre entidades

Modelo recomendado:

- uma `organization` possui muitos `users`;
- uma `organization` possui muitos `processes`;
- um `process` possui muitos `documents`;
- um `document` pertence a um `process`;
- um `document` também deve armazenar `organizationId`.

### Observação importante

Mesmo quando um documento já possui `processId`, ele também deve ter `organizationId`.

Isso facilita:

- autorização;
- filtros por organização;
- índices de banco;
- consistência nas consultas.

## Middlewares, hooks e plugins

No Fastify, a arquitetura deve preferir:

- `plugins` para infraestrutura global;
- `preHandler` para autenticação e regras simples de acesso;
- policies para autorização de domínio;
- casos de uso para autorização que depende de dados do banco.

### Onde cada coisa entra

#### Plugins globais

Ficam em `plugins/`.

Exemplos:

- CORS
- auth
- banco
- logging
- error handling
- segurança

#### Pre-handlers de autenticação

Ficam em `shared/auth/`.

Exemplos:

- `require-auth.ts`
- `require-admin.ts`

#### Policies de domínio

Ficam dentro do módulo correspondente.

Exemplos:

- `users.policies.ts`
- `organizations.policies.ts`
- `processes.policies.ts`
- `documents.policies.ts`

#### Regras que dependem de dados do banco

Devem ser aplicadas no caso de uso.

Exemplo:

- carregar um documento;
- verificar se `actor.organizationId === document.organizationId`;
- autorizar ou negar.

## Regras arquiteturais

- Não criar `service` ou `repository` por obrigação.
- Não criar classe quando função resolve melhor.
- Não colocar query de banco dentro da rota.
- Não colocar regras de autorização espalhadas em handlers.
- Não transformar `shared/` em pasta genérica de regras de negócio.
- Toda operação deve ter schema de entrada.
- Toda policy deve ser explícita e testável.
- Toda entidade operacional deve carregar `organizationId`.
- Toda query de recurso organizacional deve respeitar escopo de organização.

## Quando extrair mais camadas

Camadas adicionais só devem ser extraídas quando houver necessidade real.

Exemplos:

- extrair helper ou repository quando a mesma query começar a se repetir;
- extrair serviços de domínio quando houver fluxos complexos com múltiplas etapas;
- extrair autorização mais centralizada apenas se as policies começarem a ficar duplicadas em excesso.

## Convenções recomendadas

- nomes de arquivos por ação: `get-user.ts`, `create-process.ts`;
- schemas por módulo: `users.schemas.ts`, `documents.schemas.ts`;
- policies por módulo: `users.policies.ts`, `documents.policies.ts`;
- erros da aplicação com classes próprias;
- contratos de API definidos pelos schemas;
- preferir funções puras ou quase puras onde possível.

## Resumo final

Esta arquitetura adota:

- módulos por domínio;
- funções por caso de uso;
- Fastify como camada HTTP e composição;
- Drizzle como acesso direto ao banco;
- Better Auth como autenticação;
- autorização simples e explícita por policies;
- crescimento por extração gradual, e não por antecipação.

É uma arquitetura orientada à simplicidade inicial, mas com estrutura suficiente para escalar o domínio sem perder clareza.

# licitadoc

Monorepo inicial com Turbo para:

- `apps/web`: frontend em Vite + React + React Router
- `apps/api`: backend em Fastify
- `packages/api-client`: cliente tipado e hooks do TanStack Query gerados com Kubb a partir da spec OpenAPI
- `packages/config-typescript`: presets de TypeScript

## Contrato da API

- a documentacao OpenAPI nasce das schemas das rotas do `apps/api`
- o backend exporta a spec gerada em `apps/api/openapi/openapi.json`
- o backend tambem expõe a spec em runtime em `/openapi.json`
- o `packages/api-client` consome essa spec via Kubb pelo endpoint `http://127.0.0.1:3333/openapi.json`
- `packages/api-client/src/gen` é sempre gerado pelo Kubb e nao deve ser editado manualmente nem versionado
- frontend e backend devem evoluir o contrato a partir das rotas/schemas da API, e nao por tipos manuais duplicados

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm --filter @licitadoc/api-client generate
```

## API E2E

Os testes E2E do `apps/api` usam HTTP real contra um servidor Fastify local e devem apontar para um banco dedicado. A suite `pnpm test:e2e` cobre hoje os fluxos de autenticacao, convites, users, organizations, departments e processes, e a limpeza de fixtures acontece dentro do banco E2E isolado.

1. Suba o Postgres local:

```bash
docker compose up -d postgres
```

2. Crie um banco exclusivo para o fluxo E2E:

```bash
createdb -h localhost -U postgres licitadoc_auth_e2e
```

3. Rode as migrations no banco E2E:

```bash
cd apps/api
AUTH_E2E_DATABASE_URL=postgres://postgres:postgres@localhost:5432/licitadoc_auth_e2e \
DATABASE_URL=postgres://postgres:postgres@localhost:5432/licitadoc_auth_e2e \
pnpm db:migrate
```

4. Execute a suite dedicada:

```bash
cd apps/api
AUTH_E2E_DATABASE_URL=postgres://postgres:postgres@localhost:5432/licitadoc_auth_e2e \
pnpm test:e2e
```

Em CI, exponha `AUTH_E2E_DATABASE_URL` para um banco limpo da pipeline e rode `pnpm db:migrate` antes de `pnpm test:e2e`. O runner reutiliza `AUTH_E2E_DATABASE_URL` como `DATABASE_URL` durante o boot da app, entao a suite nao depende do banco de desenvolvimento.

## API Docs

Para manutencao da `apps/api`, consulte:

- `apps/api/agents.md` para fluxo de trabalho, comandos e limites de mudanca no backend
- `apps/api/architecture.md` para o mapa da arquitetura atual da API

## Expense Request Upload Seed

Para testar manualmente `POST /api/processes/from-expense-request/pdf` com dados compativeis com o SD de referencia, a API agora tem um seed dedicado que prepara:

- uma organizacao com CNPJ `08.290.223/0001-42`
- um departamento com `budgetUnitCode` `06.001`
- um usuario `organization_owner` autenticavel

Fluxo recomendado:

```bash
docker compose up -d postgres localstack
cd apps/api
pnpm db:migrate
pnpm seed:expense-request-upload
pnpm dev
```

Credenciais do fixture:

- email: `expense-request-upload-owner@licitadoc.local`
- senha: `P@ssword123!`

Exemplo de login:

```bash
curl -i -c /tmp/licitadoc-expense-upload.cookies \
  -X POST http://localhost:3333/api/auth/sign-in/email \
  -H "content-type: application/json" \
  -d '{"email":"expense-request-upload-owner@licitadoc.local","password":"P@ssword123!"}'
```

Exemplo de upload do SD:

```bash
curl -b /tmp/licitadoc-expense-upload.cookies \
  -X POST http://localhost:3333/api/processes/from-expense-request/pdf \
  -F "file=@/absolute/path/to/SD.pdf;type=application/pdf" \
  -F "sourceLabel=SD.pdf"
```

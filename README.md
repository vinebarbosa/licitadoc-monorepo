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

## Próximos passos

- instalar e configurar Tailwind/shadcn no `apps/web`
- conectar Better Auth e Drizzle no `apps/api`
- substituir os placeholders atuais do backend por implementacoes reais com banco/auth
- criar schema inicial do banco
- implementar as primeiras rotas de autenticação e organizações

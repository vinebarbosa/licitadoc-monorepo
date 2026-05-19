## Context

A API vive em `apps/api` dentro de um monorepo `pnpm`/Turbo. O projeto da Vercel já foi configurado com root directory `apps/api`, mas os deploys acionados diretamente pela Vercel tornam o diagnóstico difícil porque a plataforma executa validações depois do build do pacote.

O novo fluxo deve fazer o GitHub Actions virar a fonte de verdade do CI/CD da API: primeiro valida o pacote localmente no runner, depois usa a Vercel CLI para gerar o build Vercel no próprio GitHub Actions e publicar o resultado na Vercel.

## Goals / Non-Goals

**Goals:**

- Criar um workflow GitHub Actions específico para a API.
- Rodar validações da API antes de qualquer deploy.
- Publicar Preview deployments da API na Vercel para PRs/branches.
- Publicar Production deployments da API na Vercel somente a partir da `main`.
- Documentar os secrets e settings necessários para operar o fluxo.
- Evitar deploy duplicado pelo Git integration automático da Vercel.

**Non-Goals:**

- Trocar a API de plataforma ou dockerizar novamente.
- Alterar rotas, contratos HTTP, schemas de banco ou runtime da aplicação.
- Resolver bugs de compatibilidade da API com o runtime serverless da Vercel fora do escopo do CI/CD.
- Colocar secrets de aplicação no GitHub quando eles já pertencem ao ambiente da Vercel.

## Decisions

### GitHub Actions orquestra o pipeline

O workflow ficará em `.github/workflows/api-vercel.yml` e será acionado por `pull_request`, `push` na `main` e `workflow_dispatch`. O job de validação usará Node.js 24 para acompanhar o runtime usado no deploy, habilitará `corepack`, instalará dependências com `pnpm install --frozen-lockfile` e rodará:

- `pnpm --filter @licitadoc/api typecheck`
- `pnpm --filter @licitadoc/api build`
- `pnpm --filter @licitadoc/api test`

Alternativa considerada: usar apenas o deploy automático da Vercel. Foi descartada porque mantém a validação opaca e não permite separar claramente CI de CD.

### Deploy via Vercel CLI com build prebuilt

Depois da validação, o workflow instalará `vercel@latest`, executará `vercel pull`, `vercel build` e `vercel deploy --prebuilt`. Esse padrão mantém o build no GitHub Actions e evita que a Vercel faça uma segunda build a partir do código-fonte.

Preview:

- `vercel pull --yes --environment=preview --cwd apps/api --token=${{ secrets.VERCEL_TOKEN }}`
- `vercel build --cwd apps/api --token=${{ secrets.VERCEL_TOKEN }}`
- `vercel deploy --prebuilt --cwd apps/api --token=${{ secrets.VERCEL_TOKEN }}`

Production:

- `vercel pull --yes --environment=production --cwd apps/api --token=${{ secrets.VERCEL_TOKEN }}`
- `vercel build --prod --cwd apps/api --token=${{ secrets.VERCEL_TOKEN }}`
- `vercel deploy --prebuilt --prod --cwd apps/api --token=${{ secrets.VERCEL_TOKEN }}`

Alternativa considerada: usar deploy hook da Vercel. Foi descartada porque deploy hook transfere o build de volta para a Vercel e reduz o valor do CI/CD controlado pelo GitHub.

### Secrets ficam separados por responsabilidade

O GitHub precisa apenas dos secrets de automação da Vercel:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

As variáveis de runtime da API, como `DATABASE_URL`, `BETTER_AUTH_SECRET` e storage, continuam configuradas no projeto da Vercel e são puxadas para o build com `vercel pull`.

### Vercel Git auto-deploy deve ser desativado para a API

Como o GitHub Actions passará a criar os deployments, o projeto da API na Vercel deve desativar deploys automáticos pelo Git integration, preferencialmente via `vercel.json` no root do projeto da API com `git.deploymentEnabled: false`, ou por setting equivalente no dashboard.

Alternativa considerada: manter os dois fluxos ativos. Foi descartada porque geraria deploys duplicados e resultados conflitantes.

## Risks / Trade-offs

- [Risk] O projeto da Vercel continuar com auto-deploy ativo e criar deploys duplicados -> Mitigation: adicionar configuração para desabilitar Git auto-deploy e documentar a conferência no dashboard.
- [Risk] Secrets `VERCEL_*` ausentes ou incorretos no GitHub -> Mitigation: documentar nomes exatos e fazer o workflow falhar antes do deploy.
- [Risk] `vercel build` ainda expor incompatibilidades serverless da API -> Mitigation: tratar isso como falha legítima do pipeline, impedindo deploy quebrado.
- [Risk] PRs de forks não receberem secrets do repositório -> Mitigation: rodar validação sem deploy quando secrets não estiverem disponíveis.
- [Risk] `vercel@latest` mudar comportamento -> Mitigation: manter o workflow simples e permitir fixar uma versão caso surja instabilidade.

## Migration Plan

1. Adicionar o workflow da API.
2. Adicionar documentação com os secrets e comandos de validação/deploy.
3. Configurar `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` no GitHub.
4. Desativar auto-deploy Git no projeto da API na Vercel.
5. Rodar `workflow_dispatch` para validar Preview.
6. Fazer merge na `main` para validar Production.

Rollback: desabilitar o workflow no GitHub Actions e reativar o deploy automático da Vercel pelo dashboard ou removendo a configuração que bloqueia Git deployments.

## Open Questions

- O projeto da API na Vercel já tem `VERCEL_PROJECT_ID` disponível via `.vercel/project.json` local ou será necessário buscar pelo dashboard/CLI?
- O deploy de Preview deve comentar a URL no PR usando `gh`/GitHub API ou basta aparecer no resumo do job por enquanto?

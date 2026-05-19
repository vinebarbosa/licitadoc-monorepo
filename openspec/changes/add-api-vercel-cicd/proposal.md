## Why

Deploys da API na Vercel hoje dependem do fluxo automático da plataforma, que executa validações próprias depois do build e tem dificultado diagnosticar falhas. Precisamos de um CI/CD controlado no GitHub para validar a API primeiro e só acionar o deploy na Vercel quando o pipeline estiver verde.

## What Changes

- Adicionar um workflow do GitHub Actions para a API do monorepo.
- Validar instalação, typecheck, build e testes relevantes da API antes do deploy.
- Acionar deploy de Preview na Vercel para branches/PRs e deploy de Production na Vercel para `main`.
- Documentar os secrets necessários para o GitHub Actions se autenticar na Vercel.
- Manter o deploy orientado ao projeto `licitadoc-monorepo-api` na Vercel e ao root da API (`apps/api`).

## Capabilities

### New Capabilities

- `api-vercel-cicd`: CI/CD da API via GitHub Actions com validação da API e deploy automatizado na Vercel.

### Modified Capabilities

- None.

## Impact

- Novo workflow em `.github/workflows/`.
- Possível documentação de operação/deploy para a API.
- Uso de GitHub Actions, Vercel CLI e secrets do repositório.
- Não altera endpoints públicos da API nem contratos de banco de dados.

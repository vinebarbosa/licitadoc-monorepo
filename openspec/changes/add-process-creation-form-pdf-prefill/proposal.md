## Why

A listagem de processos ja oferece o ponto de entrada operacional, mas o usuario ainda nao tem uma tela real para criar processos no frontend. A criacao por PDF de Solicitacao de Despesa precisa reduzir erros antes do envio: em vez de mandar o arquivo direto e descobrir problemas depois, o usuario deve ver os dados extraidos, corrigir campos e so entao criar o processo.

## What Changes

- Adicionar uma rota protegida para criacao de processo no app web, acionada pelo CTA de novo processo da listagem/sidebar.
- Implementar um formulario de criacao manual com os campos exigidos por `POST /api/processes/`: tipo, numero do processo, data de emissao, objeto, justificativa, responsavel, departamentos, status/default e organizacao quando o ator for admin.
- Permitir importar um PDF de Solicitacao de Despesa do TopDown no formulario.
- Extrair texto e campos do PDF no frontend para pre-preencher o formulario antes da criacao do processo.
- Exibir os campos extraidos como sugestoes editaveis, com indicacao de dados ausentes ou ambiguos que exigem revisao do usuario.
- Criar o processo somente apos confirmacao do formulario revisado pelo usuario, usando o endpoint manual existente `POST /api/processes/`.
- Preservar a possibilidade de usar o endpoint existente de PDF no backend como fallback futuro ou fluxo separado, sem depender dele para o pre-preenchimento desta tela.
- Usar APIs existentes para carregar organizacoes e departamentos necessarios ao formulario.

## Capabilities

### New Capabilities

- `web-process-creation-page`: Define a experiencia web protegida para criar processos manualmente ou a partir de PDF TopDown com extracao local, pre-preenchimento revisavel e envio ao contrato existente de criacao de processos.

### Modified Capabilities

None.

## Impact

- Affected code: `apps/web/src/app/router.tsx`, `apps/web/src/modules/processes/**`, app shell/sidebar/breadcrumbs, MSW fixtures, testes de pagina/modelo e possivelmente utilitarios compartilhados de upload/parse no frontend.
- APIs: usa contratos existentes de `POST /api/processes/`, `GET /api/departments/` e, para admins, `GET /api/organizations/`; nao exige endpoint novo.
- Dependencies: pode exigir uma biblioteca client-side para leitura de PDF/texto, preferencialmente isolada no modulo de processos e avaliada pelo tamanho do bundle.
- Backend: nenhuma mudanca esperada no banco ou nas regras de criacao; o backend continua validando autorizacao, organizacao, departamentos e conflito de numero do processo.
- Systems: experiencia autenticada do app shell, cliente gerado `@licitadoc/api-client`, TanStack Query, roteamento protegido e suite de testes web.

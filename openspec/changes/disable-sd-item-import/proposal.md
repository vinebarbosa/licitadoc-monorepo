## Why

A importacao da SD deve acelerar o preenchimento dos dados gerais do processo, mas os itens exigem revisao operacional propria e serao cadastrados manualmente pelo usuario. Importar itens automaticamente cria retrabalho e pode induzir o formulario a assumir linhas da SD que ainda nao foram validadas para a contratacao.

## What Changes

- Remover o preenchimento automatico de itens quando dados de uma SD forem aplicados no formulario de novo processo.
- Manter a leitura da SD para dados basicos, organizacao, unidade orcamentaria/departamento, referencia e avisos.
- Permitir que o preview informe que itens foram encontrados na SD apenas como contexto, sem criar linhas na etapa de itens.
- Preservar itens ja digitados manualmente quando o usuario aplicar ou reaplicar uma SD.
- Ajustar testes para garantir que o payload final so contenha itens inseridos manualmente.

## Capabilities

### New Capabilities

- `web-sd-import-manual-items`: Define que a importacao web de SD preenche somente dados gerais e vinculos, mantendo os itens do processo sob entrada manual do usuario.

### Modified Capabilities

None.

## Impact

- Affected code: `apps/web/src/modules/processes/ui/sd-import-flow.ts`, `apps/web/src/modules/processes/ui/sd-import-dialog.tsx`, `apps/web/src/modules/processes/ui/process-form-wizard.tsx`, testes do fluxo de criacao de processo e do mapper de importacao.
- APIs: nenhuma mudanca; o envio final continua usando o payload manual de `POST /api/processes/`.
- Backend: nenhuma mudanca esperada.
- UX: o usuario ainda ve o importador de SD, mas a etapa de itens permanece vazia ou preserva o que foi digitado manualmente.

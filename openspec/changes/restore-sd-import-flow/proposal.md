## Why

A tela atual de criacao de processo perdeu o ponto de entrada para importar uma Solicitacao de Despesa, embora o fluxo ja existisse na UI anterior e ainda haja parser frontend para PDF TopDown. Restaurar essa acao reduz retrabalho do usuario e preserva o caminho operacional de criar processo a partir dos dados oficiais da SD antes da geracao dos documentos.

## What Changes

- Reintroduzir uma acao secundaria de importacao de SD na tela protegida de novo processo.
- Permitir selecionar um PDF TopDown de Solicitacao de Despesa, extrair os campos no frontend e revisar o resultado antes de aplicar ao formulario.
- Preencher dados basicos, vinculos institucionais e itens do processo quando a SD puder ser interpretada, mantendo todos os campos editaveis.
- Exibir indicacao compacta de que os dados foram importados da SD aplicada, incluindo nome do arquivo e avisos relevantes.
- Diferenciar falhas de leitura do PDF, arquivo que nao e SD reconhecida, campos obrigatorios ausentes e ausencia de correspondencia com organizacao ou unidade orcamentaria.
- Manter o envio final pelo fluxo manual existente de `POST /api/processes/`, com o backend preservando validacoes de escopo, departamento e numero duplicado.
- Cobrir regressao para o importador no formulario atual, incluindo cancelamento sem sobrescrever campos e aplicacao bem-sucedida de uma SD legivel.

## Capabilities

### New Capabilities

- `web-sd-import-flow`: Define a experiencia web de importar Solicitacao de Despesa no formulario de novo processo, revisar dados extraidos, aplicar sugestoes editaveis e recuperar falhas sem bloquear criacao manual.

### Modified Capabilities

None.

## Impact

- Affected code: `apps/web/src/modules/processes/pages/process-create-page.tsx`, `apps/web/src/modules/processes/ui/process-form-wizard.tsx`, `apps/web/src/modules/processes/model/expense-request-pdf.ts`, testes de pagina/modelo e fixtures de MSW quando necessario.
- APIs: nenhuma API nova; o submit continua usando `POST /api/processes/`, `GET /api/departments/`, `GET /api/organizations/` para admins e `GET /api/organizations/me` para atores de organizacao.
- Dependencies: reutiliza a dependencia atual de `pdfjs-dist` no app web se ja estiver instalada.
- Backend: nenhuma mudanca esperada; regras de autorizacao, escopo e validacao continuam no backend.
- UX: restaura um atalho importante sem transformar a importacao em superficie principal da pagina.

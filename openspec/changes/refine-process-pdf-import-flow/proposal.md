## Why

A importacao de PDF na tela de novo processo esta visualmente pesada e ocupa a primeira area da pagina, quando deveria ser uma acao auxiliar do formulario. Alem disso, o `SD.pdf` real usado pelo usuario e extraido com sucesso pelo backend, mas a experiencia atual do frontend mostra erro generico, indicando que a leitura/parsing no browser nao esta seguindo o mesmo comportamento observavel do intake existente.

## What Changes

- Substituir o card fixo de "Importar PDF TopDown" por um botao discreto de importacao no cabecalho ou na area de acoes do formulario.
- Abrir a importacao em um dialog/modal focado, com seletor de arquivo, estado de leitura, resultado, avisos e acoes claras de aplicar ou cancelar.
- Manter o formulario principal limpo, exibindo apenas um resumo sutil quando dados tiverem sido importados.
- Corrigir a importacao do `SD.pdf` real para que o frontend consiga extrair e pre-preencher os campos quando o mesmo PDF e legivel pelo backend.
- Alinhar o parser frontend ao comportamento do parser backend para os campos da Solicitacao de Despesa: numero, referencia `SD-<numero>-<ano>`, data, tipo, classificacao/objeto, justificativa, CNPJ, unidade orcamentaria, responsavel e metadados.
- Melhorar mensagens de erro para distinguir falha de leitura do PDF, falha de parser/campos obrigatorios e ausencia de correspondencia com organizacao/departamento.
- Adicionar cobertura com fixture representativa do `SD.pdf` TopDown real para evitar regressao.

## Capabilities

### New Capabilities

- `web-process-pdf-import-flow`: Define a experiencia refinada de importacao de PDF TopDown no formulario de novo processo, incluindo dialog discreto, diagnostico de falhas e paridade de extracao com o backend.

### Modified Capabilities

None.

## Impact

- Affected code: `apps/web/src/modules/processes/pages/process-create-page.tsx`, `apps/web/src/modules/processes/model/expense-request-pdf.ts`, testes do modulo de processos, MSW/fixtures e Playwright da criacao de processo.
- APIs: nenhuma API nova; o envio final continua usando `POST /api/processes/`.
- Backend: nenhuma mudanca esperada, mas os testes devem usar o comportamento atual de `apps/api/src/modules/processes/expense-request-parser.ts` como referencia de paridade.
- UX: reduz destaque visual da importacao e melhora feedback para o usuario quando o arquivo nao puder ser aplicado.

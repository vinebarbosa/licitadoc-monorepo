## Context

O app web ja tem uma pagina protegida de criacao de processo em `/app/processo/novo`, composta por `ProcessCreatePage` e `ProcessFormWizard`. O wizard atual cobre criacao manual em etapas, mas nao expoe mais a importacao de SD que existia na UI anterior.

Ainda existe suporte de modelo para ler PDF TopDown em `apps/web/src/modules/processes/model/expense-request-pdf.ts`, usando `pdfjs-dist`, extraindo texto e retornando campos de SD, itens e avisos. Esse retorno foi feito para um modelo anterior de formulario (`ProcessCreationFormValues`) e precisa ser adaptado ao modelo do wizard atual (`ProcessFormValues`) antes de voltar para a UI.

## Goals / Non-Goals

**Goals:**

- Restaurar a acao de importar SD na tela atual de novo processo.
- Reaproveitar o parser frontend existente para PDF TopDown.
- Mostrar preview e avisos antes de aplicar dados ao formulario.
- Aplicar os dados extraidos ao wizard atual sem criar um fluxo paralelo de criacao.
- Preencher departamento por codigo de unidade orcamentaria quando houver correspondencia local.
- Manter criacao manual funcionando mesmo quando a importacao falhar ou for cancelada.

**Non-Goals:**

- Criar ou alterar endpoints backend.
- Persistir o arquivo PDF bruto nesse fluxo.
- Transformar a importacao em etapa obrigatoria.
- Reescrever o wizard de criacao ou substituir o modelo visual atual.
- Resolver OCR para PDFs escaneados ou imagem-only.

## Decisions

### Decision: A importacao sera uma acao secundaria dentro do wizard atual

Adicionar a acao no topo da pagina ou do primeiro card de dados, abrindo um `Dialog` do design system. O formulario continua sendo a superficie principal; a importacao apenas prepara sugestoes.

Alternativas consideradas:

- Criar uma rota separada para importar SD. Rejeitado porque fragmenta a criacao e recria uma UI que ja esta centralizada no wizard.
- Colocar a importacao como etapa obrigatoria. Rejeitado porque muitos processos ainda podem ser criados manualmente.

### Decision: O dialog mantem estado local ate o usuario aplicar

O arquivo selecionado sera lido pelo parser existente e transformado em um preview no dialog. Fechar o dialog ou trocar o arquivo nao altera o formulario. Somente o comando explicito de aplicar atualiza `ProcessFormValues`.

Alternativas consideradas:

- Preencher o formulario imediatamente apos selecionar o PDF. Rejeitado porque torna cancelamento e substituicao de arquivo arriscados.
- Enviar o PDF para o backend para preview. Rejeitado porque o pedido e restaurar a experiencia local de importacao da UI anterior sem ampliar API.

### Decision: Criar um mapper entre extracao de SD e `ProcessFormValues`

O parser retorna sugestoes com `type`, `expenseRequestItems`, `sourceReference` e metadados de origem. O wizard atual espera `formaContratacao`, `modalidade`, `processNumber`, `items`, `departmentIds` e demais campos. A implementacao deve introduzir um helper testavel que:

- copia numero, ID externo, data, titulo, objeto, justificativa e responsavel;
- mapeia itens extraidos para `ProcessItem[]`;
- escolhe uma forma/modalidade conservadora quando o tipo da SD nao corresponder diretamente aos selects atuais;
- preserva organizacao forçada para usuarios nao-admin;
- para admin, tenta selecionar organizacao por CNPJ se a lista carregada contiver correspondencia;
- tenta selecionar departamento por `budgetUnitCode` dentro da organizacao efetiva;
- retorna avisos de match sem bloquear a aplicacao quando os campos obrigatorios puderem ser revisados manualmente.

Alternativas consideradas:

- Reativar o modelo antigo de formulario inteiro. Rejeitado porque a UI atual ja consolidou etapas, itens e payload em `ProcessFormWizard`.
- Misturar a logica de mapeamento dentro do componente. Rejeitado porque dificulta testes de regressao para casos de SD real.

### Decision: O submit continua sendo manual por `POST /api/processes/`

A aplicacao da SD atualiza campos editaveis; o envio segue pelo adaptador existente de criacao de processos. O backend continua validando escopo, departamento, duplicidade de numero e obrigatoriedade. Como o schema atual de criacao manual e estrito, a UI nao deve enviar campos de origem que o endpoint nao aceite.

Alternativas consideradas:

- Usar o endpoint backend de intake por PDF no submit. Rejeitado porque esse endpoint cria o processo diretamente, sem preservar as edicoes feitas pelo usuario no wizard.
- Alterar o schema de `POST /api/processes/` para aceitar metadados de origem. Fora do escopo desta restauracao de UI.

## Risks / Trade-offs

- [Risk] O parser frontend pode continuar divergindo do backend para PDFs reais. -> Mitigacao: cobrir o mapper e o fluxo de UI com fixture representativa e manter mensagens de erro especificas por etapa.
- [Risk] O tipo da SD (`Servico`, por exemplo) nao mapeia perfeitamente para forma/modalidade do wizard. -> Mitigacao: preencher campos de objeto, titulo e itens com alta confianca e usar defaults conservadores/editaveis para selects de contratacao.
- [Risk] Departamento ou organizacao nao carregam antes da aplicacao. -> Mitigacao: bloquear ou sinalizar o match automatico ate as referencias estarem disponiveis e manter selecao manual obrigatoria.
- [Risk] Usuario pode aplicar importacao sobre campos ja preenchidos. -> Mitigacao: mostrar preview antes da aplicacao e indicar que a aplicacao substituirá valores do formulario atual.
- [Risk] PDF sem texto selecionavel nao sera importado. -> Mitigacao: informar falha de leitura e manter o preenchimento manual disponivel.

## Migration Plan

1. Adicionar mapper e testes unitarios para converter a extracao da SD no formato do wizard.
2. Adicionar o dialog de importacao e a acao secundaria no `ProcessFormWizard` ou na pagina de criacao.
3. Integrar aplicacao da extracao aos estados atuais do wizard e ao resumo lateral.
4. Cobrir o fluxo em testes de pagina: abrir dialog, cancelar, aplicar, falhar e submeter depois da aplicacao.

Rollback: remover a acao e o dialog restaura o comportamento manual atual sem impacto no backend ou em dados existentes.

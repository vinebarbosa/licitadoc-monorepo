## Context

A implementacao atual do importador de SD em `restore-sd-import-flow` mapeia `expenseRequestItems` extraidos do PDF para `ProcessFormValues.items`. O usuario decidiu que os itens nao devem vir da SD: eles continuam sendo uma etapa manual do processo, separada da leitura dos dados gerais da solicitacao.

Essa mudanca atua apenas no frontend. O parser pode continuar extraindo itens internamente porque essa informacao ajuda a diagnosticar a SD e pode aparecer como contagem no preview, mas a aplicacao dos dados no wizard nao deve criar, substituir ou remover itens.

## Goals / Non-Goals

**Goals:**

- Impedir que a aplicacao de uma SD preencha automaticamente a etapa de itens.
- Preservar itens ja digitados manualmente quando uma SD for aplicada ou reaplicada.
- Manter o preview da SD focado em dados gerais, vinculos e referencia, sem prometer importacao de itens.
- Ajustar testes para garantir payload final sem itens importados automaticamente.

**Non-Goals:**

- Remover a capacidade do parser de reconhecer itens da SD.
- Alterar endpoints ou schemas do backend.
- Bloquear a criacao manual de itens depois da importacao.
- Persistir metadados de item extraido em outro local.

## Decisions

### Decision: O mapper nao altera `ProcessFormValues.items`

`applySdImportToProcessForm` deve deixar `items` exatamente como estavam antes da aplicacao da SD. Se o formulario estava sem itens, permanece sem itens. Se o usuario ja cadastrou itens manualmente, eles permanecem.

Alternativas consideradas:

- Limpar os itens sempre que uma SD for aplicada. Rejeitado porque poderia apagar trabalho manual ja feito.
- Importar itens como rascunhos desabilitados. Rejeitado porque ainda levaria o usuario a revisar dados que o produto quer tratar manualmente.

### Decision: O dialog pode manter uma contagem contextual, mas nao uma promessa de importacao

O preview pode dizer que linhas de item foram detectadas, desde que a copia e os testes deixem claro que elas nao serao aplicadas ao formulario. A acao principal continua sendo aplicar dados gerais da SD.

Alternativas consideradas:

- Remover toda mencao a itens do preview. Possivel, mas menos transparente quando a SD contem itens; a contagem ajuda a explicar que o arquivo foi lido sem sugerir preenchimento automatico.

## Risks / Trade-offs

- [Risk] Usuario pode esperar que a contagem de itens gere linhas no formulario. -> Mitigacao: ajustar texto do preview/resumo para indicar que os itens serao inseridos manualmente.
- [Risk] Testes existentes podem assumir item importado no payload. -> Mitigacao: atualizar cobertura para validar ausencia de itens importados e preservacao de itens manuais.
- [Risk] O parser continua carregando dados de item que nao sao usados. -> Mitigacao: manter por enquanto para baixo risco e compatibilidade; uma limpeza maior pode vir depois se necessario.

## Migration Plan

1. Remover o mapeamento de `expenseRequestItems` para `ProcessFormValues.items`.
2. Ajustar textos do dialog/summary que possam sugerir importacao de itens.
3. Atualizar testes unitarios e de pagina para cobrir formulario vazio, preservacao de itens manuais e payload sem itens automaticos.

Rollback: restaurar o mapeamento de `expenseRequestItems` para `items` no helper de importacao.

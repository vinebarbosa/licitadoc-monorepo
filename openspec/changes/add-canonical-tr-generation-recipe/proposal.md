## Why

A geracao de `tr` ainda depende do prompt generico de documentos, o que deixa o resultado estruturalmente instavel e aumenta o risco de mistura com secoes de `DFD` e `ETP`. O Termo de Referencia precisa ser mais tecnico, operacional e contratual, com obrigacoes, prazos, pagamento, fiscalizacao e sancoes gerados de forma previsivel e segura.

## What Changes

- Introduzir uma receita editorial completa para `tr`, composta por `tr.instructions.md` e `tr.template.md`, gerenciada no repositorio e resolvida em runtime pelo backend.
- Derivar o template apenas do bloco `TERMO DE REFERENCIA` do documento de referencia, mantendo os topicos canonicos: objeto, justificativa da contratacao, especificacoes tecnicas do servico, obrigacoes da contratada, obrigacoes da contratante, prazo de execucao, valor estimado e dotacao orcamentaria, condicoes de pagamento, gestao e fiscalizacao do contrato, sancoes administrativas e fecho.
- Fazer a geracao de `tr` usar a receita canonica, o contexto estruturado do processo/SD, dados de organizacao/departamento, instrucoes opcionais do operador e, quando houver, contexto consistente de DFD/ETP sem incorporar suas secoes.
- Definir regras editoriais para que o TR transforme o objeto e o contexto em orientacoes operacionais claras, sem inventar dados tecnicos, datas, locais, duracoes, estruturas ou valores nao informados.
- Exigir que a secao `VALOR ESTIMADO E DOTACAO ORCAMENTARIA` sempre exista e trate valor ausente ou `R$ 0,00` como ausencia de estimativa, nunca como preco valido.
- Criar no `tr.instructions.md` a secao `Obrigacoes por tipo de contratacao`, com blocos para `apresentacao_artistica`, `prestacao_servicos_gerais`, `fornecimento_bens`, `obra_engenharia`, `locacao_equipamentos` e `eventos_gerais`.
- Sanitizar o fluxo de `tr` para impedir incorporacao de secoes tipicas de DFD, como `DADOS DA SOLICITACAO`, e estruturas analiticas de ETP, como `LEVANTAMENTO DE MERCADO` ou `ANALISE DE ALTERNATIVAS`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `document-generation-recipes`: passa a exigir receita canonica, runtime-resoluble, para `tr`, incluindo instrucoes editoriais e template Markdown.
- `document-generation`: passa a montar pedidos de geracao de `tr` a partir da receita canonica e a persistir somente conteudo com estrutura de TR, sem valores ficticios e sem secoes de DFD/ETP.

## Impact

- Afeta `apps/api/src/modules/documents`, especialmente o registry de receitas, a montagem de prompt, o contexto estruturado usado por `tr`, a normalizacao de estimativa e a sanitizacao de rascunhos gerados.
- Adiciona ativos Markdown em `apps/api/src/modules/documents/recipes`.
- Requer testes cobrindo resolucao da receita de TR, template canonico, selecao/orientacao de blocos de obrigacoes, tratamento de `R$ 0,00`/valor ausente e remocao de secoes indevidas de DFD/ETP.
- Nao exige migracao de banco nem mudanca no contrato publico de tipos de documentos, pois `tr` ja e um tipo suportado.

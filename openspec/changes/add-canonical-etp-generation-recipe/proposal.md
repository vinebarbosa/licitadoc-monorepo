## Why

A geracao de `etp` ainda depende do prompt generico de documentos, o que deixa a estrutura final variavel e abre risco de o modelo inferir valor, simular pesquisa de mercado ou incorporar secoes de outros tipos documentais. Como ja existe uma receita canonica para `dfd` e um ETP de referencia validado, a geracao de ETP deve seguir o mesmo padrao versionado e previsivel.

## What Changes

- Introduzir uma receita editorial completa para `etp`, composta por `etp.instructions.md` e `etp.template.md`, gerenciada no repositorio e resolvida em runtime pelo backend.
- Derivar o template apenas do bloco `ESTUDO TECNICO PRELIMINAR (ETP)` do documento de referencia, mantendo todos os topicos observados: introducao, necessidade, solucao e requisitos, levantamento de mercado e alternativas, estimativa do valor, adequacao orcamentaria, sustentabilidade e impactos, gestao e fiscalizacao, conclusao e fecho.
- Fazer a geracao de `etp` usar a receita canonica, o contexto estruturado do processo/SD, dados de organizacao/departamento, instrucoes opcionais do operador e, quando houver, conteudo consistente ja utilizado no DFD.
- Definir regra critica para estimativa: valor ausente ou `R$ 0,00` deve ser tratado como ausencia de estimativa, nunca como preco valido.
- Proibir que o modelo invente valores, estime cachê/preco, simule pesquisa de mercado ou declare consultas nao constantes no contexto; nesses casos, deve registrar expressoes como `nao informado`, `nao consta no contexto` e `sera objeto de apuracao posterior`.
- Sanitizar o fluxo de `etp` para impedir incorporacao de secoes de `DFD` ou `TR`, preservando estritamente a estrutura canonica do template.

## Capabilities

### New Capabilities

### Modified Capabilities
- `document-generation-recipes`: passa a exigir receita canonica, runtime-resoluble, para `etp`, incluindo instrucoes editoriais e template Markdown.
- `document-generation`: passa a montar pedidos de geracao de `etp` a partir da receita canonica e a persistir somente conteudo com estrutura de ETP, sem valores ficticios e sem secoes de DFD/TR.

## Impact

- Afeta `apps/api/src/modules/documents`, especialmente o registry de receitas, a montagem de prompt, o contexto estruturado usado por `etp` e a sanitizacao de rascunhos gerados.
- Adiciona ativos Markdown em `apps/api/src/modules/documents/recipes`.
- Requer testes cobrindo resolucao da receita de ETP, template canonico, tratamento de `R$ 0,00`/valor ausente, ausencia de simulacao de pesquisa de mercado e remocao de secoes indevidas de DFD/TR.
- Nao exige migracao de banco nem mudanca no contrato publico de tipos de documentos, pois `etp` ja e um tipo suportado.

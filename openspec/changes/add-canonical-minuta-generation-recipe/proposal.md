## Why

A geracao de `minuta` ainda depende de instrucao generica, o que deixa a estrutura contratual instavel e aumenta o risco de o modelo inventar partes, datas, valores, documentos, enderecos ou clausulas fora do contexto. A minuta precisa seguir o mesmo padrao canonico ja adotado para DFD, ETP e TR, mas com natureza exclusivamente contratual: estrutura fixa, conteudo parcialmente adaptavel e placeholders seguros para dados ainda nao disponiveis.

## What Changes

- Introduzir uma receita editorial completa para `minuta`, composta por `minuta.instructions.md` e `minuta.template.md`.
- Derivar a estrutura canonica da minuta de contrato de referencia, usando-a apenas como base de clausulas, linguagem e profundidade juridica, sem incorporar dados reais do caso.
- Fazer `documentType=minuta` resolver receita versionada no repositorio, em vez de cair no prompt generico.
- Fixar a estrutura contratual com identificacao das partes e clausulas de objeto, preco, execucao, pagamento, vigencia, dotacao orcamentaria, obrigacoes da contratante, obrigacoes da contratada, fiscalizacao, recebimento, penalidades, rescisao, prerrogativas da Administracao, alteracao e reajuste, condicoes de habilitacao, publicidade, casos omissos e foro.
- Marcar determinadas clausulas como `FIXED` no template, exigindo preservacao textual exata, sem reescrita, resumo, simplificacao ou adaptacao, permitindo apenas substituicao de placeholders.
- Exigir placeholders para dados ausentes, como `XXX/2026`, `R$ XX.XXX,XX`, `XX de XXXXX de 2026`, `[CONTRATADA]`, `[CNPJ DA CONTRATADA]` e demais qualificacoes nao presentes no contexto.
- Garantir que a clausula de preco sempre exista, usando valor valido quando fornecido e placeholder quando o valor estiver ausente, vazio ou for `R$ 0,00`.
- Orientar as obrigacoes a partir do TR quando houver contexto disponivel; na ausencia de TR, usar a mesma logica por tipo de contratacao adotada para o TR.
- Sanitizar a minuta para impedir incorporacao de estrutura de DFD, conteudo analitico de ETP ou explicacoes tecnicas de TR.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `document-generation-recipes`: adiciona a receita canonica de `minuta`, incluindo template contratual fixo, clausulas `FIXED` imutaveis, instrucoes editoriais juridicas, placeholders obrigatorios e regras de nao invencao de dados.
- `document-generation`: passa a montar e armazenar rascunhos de `minuta` a partir da receita canonica, do contexto do processo e das regras de seguranca para valores, partes, obrigacoes, preservacao de clausulas fixas e sanitizacao contratual.

## Impact

- Afeta `apps/api/src/modules/documents`, especialmente assets de receita, registry/resolver de receitas, montagem de prompt, normalizacao de valores ausentes/zero e sanitizacao de conteudo gerado.
- Adiciona testes para resolucao da receita de `minuta`, estrutura do template, clausulas `FIXED`, instrucoes de placeholders, ausencia de invencao de valores/dados, derivacao de obrigacoes e remocao de secoes de DFD/ETP/TR.
- Nao requer migracao de banco, endpoint novo ou dependencia externa.

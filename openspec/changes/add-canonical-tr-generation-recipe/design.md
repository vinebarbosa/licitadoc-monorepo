## Context

O backend ja possui o tipo documental `tr`, mas a geracao ainda precisa de uma receita canonica equivalente ao padrao adotado para `dfd` e `etp`. O modulo `documents` ja carrega assets de receita do repositorio, monta prompts especializados por tipo documental e sanitiza conteudo gerado para evitar vazamento estrutural entre documentos.

O arquivo de referencia anexado contem `DFD`, `ETP` e `TR` no mesmo `.docx`. Para esta change, o unico bloco valido como fonte estrutural e `TERMO DE REFERENCIA`. A estrutura canonica extraida dele e:

- `OBJETO`
- `JUSTIFICATIVA DA CONTRATACAO`
- `ESPECIFICACOES TECNICAS DO SERVICO`
- `OBRIGACOES DA CONTRATADA`
- `OBRIGACOES DA CONTRATANTE`
- `PRAZO DE EXECUCAO`
- `VALOR ESTIMADO E DOTACAO ORCAMENTARIA`
- `CONDICOES DE PAGAMENTO`
- `GESTAO E FISCALIZACAO DO CONTRATO`
- `SANCOES ADMINISTRATIVAS`
- bloco final de local, data, responsavel e cargo

O TR de referencia demonstra linguagem mais operacional que DFD e ETP: transforma objeto e justificativa em regras de execucao, responsabilidades, prazos, pagamento, fiscalizacao e sancoes. O risco principal e deixar o modelo inventar especificacoes tecnicas ou obrigacoes incompatíveis quando o contexto nao trouxer esses detalhes.

## Goals / Non-Goals

**Goals:**

- Criar ativos backend `tr.instructions.md` e `tr.template.md` com estrutura fixa e comportamento editorial previsivel para TR.
- Fazer `documentType=tr` resolver receita no mesmo registry usado por `dfd` e `etp`.
- Montar prompt de `tr` com contexto estruturado de processo, organizacao, departamentos, metadados extraidos da SD e estimativa normalizada.
- Tratar valor ausente, `0`, `0,00`, `0.00` ou `R$ 0,00` como ausencia de estimativa.
- Incluir em `tr.instructions.md` uma secao `Obrigacoes por tipo de contratacao` com blocos para os tipos solicitados.
- Impedir que a saida final de TR contenha secoes de DFD ou estrutura analitica de ETP.
- Permitir reaproveitamento editorial de contexto sobreposto com DFD/ETP, sem importar headings desses documentos.

**Non-Goals:**

- Alterar os tipos publicos suportados por geracao documental.
- Criar um endpoint especifico para TR.
- Fazer classificacao deterministica perfeita de todos os objetos possiveis.
- Fazer pesquisa de mercado real, integrar fontes externas ou calcular estimativas automaticamente.
- Produzir validade juridica final sem revisao humana.
- Gerar `.docx` final nesta change.

## Decisions

### Decision: Reutilizar o padrao de receita versionada por tipo documental

`tr` deve entrar no mesmo mecanismo de `DocumentGenerationRecipe`, com dois assets carregados pelo backend: `tr.instructions.md` e `tr.template.md`. O resolver passa a retornar receita para `dfd`, `etp` e `tr`, mantendo `minuta` no prompt generico ate existir receita propria.

Alternativas consideradas:

- Manter `tr` no prompt generico.
  Rejeitada porque nao resolve variacao estrutural, mistura de secoes nem obrigacoes pouco confiaveis.
- Embutir o prompt de TR em TypeScript.
  Rejeitada porque dificulta revisao editorial e diverge do padrao de assets Markdown.

### Decision: O template fixa a estrutura operacional do TR

`tr.template.md` deve conter todos os headings extraidos do TR de referencia, sem fatos do caso FORRO TSUNAMI como conteudo fixo. Cada secao deve orientar o modelo a preencher conteudo dinamico conforme o contexto e a usar linguagem conservadora quando dados faltarem.

O template deve ser mais operacional que os templates de DFD/ETP: especificacoes tecnicas, obrigacoes, prazo, pagamento, gestao/fiscalizacao e sancoes devem aparecer como secoes obrigatorias.

Alternativas consideradas:

- Usar o bloco TR inteiro como template textual.
  Rejeitada porque congelaria detalhes de apresentacao artistica e contaminaria outros objetos.
- Reduzir o TR a um roteiro curto.
  Rejeitada porque perderia o detalhamento tecnico/contratual esperado.

### Decision: As obrigacoes serao guiadas por blocos editoriais por tipo

`tr.instructions.md` deve conter a secao `Obrigacoes por tipo de contratacao` com blocos estruturados para:

- `apresentacao_artistica`
- `prestacao_servicos_gerais`
- `fornecimento_bens`
- `obra_engenharia`
- `locacao_equipamentos`
- `eventos_gerais`

O prompt deve orientar o modelo a identificar o tipo predominante pelo objeto e contexto, selecionar o bloco correspondente, adaptar as obrigacoes ao caso e complementar apenas quando o contexto exigir. Se houver ambiguidade, deve escolher o bloco mais aderente e evitar misturar itens incompatíveis.

Alternativas consideradas:

- Gerar obrigacoes livremente.
  Rejeitada porque e o ponto de maior risco de alucinacao e inconsistência.
- Implementar uma classificacao rigida no backend ja nesta change.
  Rejeitada porque os blocos editoriais resolvem o principal risco com menor acoplamento; uma heuristica backend pode ser adicionada se os testes mostrarem necessidade.

### Decision: Normalizar estimativa antes de montar o prompt

O contexto de TR deve reutilizar a regra de estimativa segura ja adotada para ETP: valor ausente, vazio ou numericamente zero deve ser marcado como estimativa indisponivel. A secao `VALOR ESTIMADO E DOTACAO ORCAMENTARIA` deve sempre existir, mas deve indicar apuracao posterior quando nao houver valor valido.

Alternativas consideradas:

- Deixar o modelo interpretar `R$ 0,00`.
  Rejeitada porque `R$ 0,00` representa ausencia de estimativa no fluxo de SD.
- Remover a secao de valor quando nao houver estimativa.
  Rejeitada porque a estrutura canonica exige a secao.

### Decision: Reaproveitamento de DFD/ETP deve ser contextual, nao estrutural

O prompt pode permitir que o modelo reaproveite objeto, justificativa, necessidade e contexto ja usados em DFD/ETP para manter consistencia e reduzir tokens. Esse reaproveitamento deve servir apenas como materia-prima narrativa; o TR deve aprofundar em nivel operacional e preservar apenas seus headings canonicos.

Alternativas consideradas:

- Injetar automaticamente documentos DFD/ETP gerados como requisito obrigatorio.
  Rejeitada para o primeiro passo porque adiciona dependencia de lifecycle de outros documentos.
- Proibir reaproveitamento textual.
  Rejeitada porque reduziria consistencia entre documentos e aumentaria reescrita desnecessaria.

### Decision: Sanitizar TR por fronteiras documentais e secoes proibidas

A sanitizacao deve ser estendida para `tr`. Se a resposta vier com DFD ou ETP antes do heading de TR, esse preambulo deve ser descartado. Depois de iniciado o TR, a persistencia deve cortar ou remover headings de `DFD`, `DOCUMENTO DE FORMALIZACAO DE DEMANDA`, `ETP`, `ESTUDO TECNICO PRELIMINAR`, `DADOS DA SOLICITACAO`, `LEVANTAMENTO DE MERCADO` e `ANALISE DE ALTERNATIVAS`.

O sanitizer protege o armazenamento contra vazamento estrutural evidente, mas o controle principal continua sendo a receita editorial e o template.

Alternativas consideradas:

- Confiar apenas no prompt.
  Rejeitada porque DFD e ETP ja demonstraram a necessidade de defesa antes da persistencia.
- Validar semanticamente todo o Markdown.
  Rejeitada por ser mais caro e fragil para esta etapa.

## Risks / Trade-offs

- [Obrigacoes ainda ficarem genericas demais] -> Incluir blocos editoriais concretos por tipo e testar pelo menos `apresentacao_artistica`, além de garantir que o prompt contenha todos os blocos.
- [Classificacao por objeto escolher tipo errado] -> Orientar o modelo a selecionar o tipo predominante e registrar linguagem conservadora quando o contexto for insuficiente.
- [Template ficar preso ao caso de referencia] -> Usar apenas headings e profundidade operacional do TR, mantendo dados concretos como contexto dinamico.
- [Modelo inventar dados tecnicos] -> Reforcar no prompt que datas, locais, duracao, infraestrutura, rider, prazos, pagamento e valores so podem aparecer quando constarem no contexto.
- [Sanitizer remover conteudo demais] -> Cobrir com testes: TR puro, DFD/ETP antes do TR e secoes proibidas depois do TR.

## Migration Plan

1. Criar `tr.instructions.md` e `tr.template.md` em `apps/api/src/modules/documents/recipes`.
2. Registrar a receita de `tr` no resolver de receitas.
3. Implementar contexto/prompt especifico de TR com estimativa normalizada e regras de obrigacoes por tipo.
4. Estender sanitizacao de rascunhos para `tr`.
5. Adicionar testes para receita, prompt, valor ausente/zero, obrigacoes por tipo e exclusao de DFD/ETP.

Rollback consiste em remover a receita de `tr` do resolver, fazendo o tipo voltar ao prompt generico. Nao ha migracao de banco.

## Open Questions

Nenhuma para a primeira implementacao.

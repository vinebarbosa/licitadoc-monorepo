## Context

O backend ja suporta o tipo documental `minuta`, mas a geracao ainda precisa de uma receita canonica equivalente ao padrao adotado para `dfd`, `etp` e `tr`. No fluxo de contratacao, a minuta nao e o contrato final assinado: ela e um modelo padronizado de contrato, reutilizavel, que integra o processo e deve conter placeholders para dados que podem nao existir no momento da geracao.

A minuta de referencia anexada foi analisada apenas como fonte estrutural e editorial. A estrutura canonica extraida dela e:

- cabecalho da minuta, processo administrativo e modalidade/procedimento;
- qualificacao das partes `CONTRATANTE` e `CONTRATADA`;
- `CLAUSULA PRIMEIRA - DO OBJETO`;
- `CLAUSULA SEGUNDA - DO PRECO`;
- `CLAUSULA TERCEIRA - DA EXECUCAO`;
- `CLAUSULA QUARTA - DO PAGAMENTO`;
- `CLAUSULA QUINTA - DO PRAZO DE VIGENCIA`;
- `CLAUSULA SEXTA - DA DOTACAO ORCAMENTARIA`;
- `CLAUSULA SETIMA - DAS OBRIGACOES DA CONTRATANTE`;
- `CLAUSULA OITAVA - DAS OBRIGACOES DA CONTRATADA`;
- `CLAUSULA NONA - DA FISCALIZACAO`;
- `CLAUSULA DECIMA - DO RECEBIMENTO E ACEITACAO`;
- `CLAUSULA DECIMA PRIMEIRA - DAS PENALIDADES`;
- `CLAUSULA DECIMA SEGUNDA - DA RESCISAO E EXTINCAO`;
- `CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS`;
- `CLAUSULA DECIMA QUARTA - DA ALTERACAO E REAJUSTE`;
- `CLAUSULA DECIMA QUINTA - DAS CONDICOES DE HABILITACAO`;
- `CLAUSULA DECIMA SEXTA - DA PUBLICIDADE`;
- `CLAUSULA DECIMA SETIMA - DOS CASOS OMISSOS`;
- `CLAUSULA DECIMA OITAVA - DO FORO`;
- fecho, local, data, assinaturas e testemunhas.

O risco principal e tratar a minuta como texto livre e deixar o modelo preencher dados juridicamente sensiveis por inferencia: nome de partes, CPF/CNPJ, enderecos, datas, valores, procedimento, dotacao ou representantes. Nesta change, a minuta deve ser entendida como `estrutura fixa + conteudo parcialmente adaptavel`.

## Goals / Non-Goals

**Goals:**

- Criar os ativos backend `minuta.instructions.md` e `minuta.template.md`.
- Fazer `documentType=minuta` resolver receita no mesmo registry usado por `dfd`, `etp` e `tr`.
- Montar prompt de `minuta` com contexto estruturado de processo, organizacao, departamentos, metadados da SD, estimativa normalizada e instrucoes opcionais do operador.
- Garantir que a estrutura contratual fixa sempre exista, inclusive clausula de preco.
- Preservar exatamente o texto das clausulas marcadas como `FIXED` no template, permitindo apenas substituicao de placeholders.
- Usar placeholders quando dados estiverem ausentes, nao confiaveis ou representados por `R$ 0,00`.
- Reutilizar conteudo de TR/ETP quando disponivel como materia-prima, convertendo para linguagem contratual.
- Derivar obrigacoes prioritariamente de TR; se TR nao estiver disponivel, usar blocos por tipo de contratacao equivalentes aos do TR.
- Impedir que a minuta persista secoes de DFD, analises de ETP ou explicacoes tecnicas de TR.

**Non-Goals:**

- Transformar a minuta em contrato final assinado.
- Gerar ou validar juridicamente dados de partes, representantes, CPF/CNPJ, enderecos, datas, valores ou dotacao sem contexto.
- Criar endpoint especifico para minuta.
- Alterar os tipos documentais publicos suportados.
- Integrar pesquisa de mercado, calcular preco ou buscar dotacao automaticamente.
- Gerar `.docx` final nesta change.

## Decisions

### Decision: Reutilizar o padrao de receita versionada por tipo documental

`minuta` deve entrar no mesmo mecanismo de `DocumentGenerationRecipe`, com dois assets Markdown carregados pelo backend: `minuta.instructions.md` e `minuta.template.md`. O resolver passa a retornar receita para `dfd`, `etp`, `tr` e `minuta`, removendo `minuta` do caminho generico.

Alternativas consideradas:

- Manter `minuta` no prompt generico. Rejeitada porque nao resolve instabilidade estrutural nem risco de dados inventados.
- Embutir a minuta em TypeScript. Rejeitada porque dificulta revisao editorial e diverge do padrao de receitas versionadas.

### Decision: O template fixa a forma contratual e deixa dados sensiveis como placeholders

`minuta.template.md` deve conter a estrutura completa de clausulas da referencia, sem os fatos do caso FORRO TSUNAMI. Identificacao de partes, numeros de processo, procedimento, datas, representantes, documentos, enderecos, preco e dotacao devem ser campos dinamicos ou placeholders.

Placeholders recomendados:

- `XXX/2026` para numero da minuta, procedimento ou instrumento quando ausente;
- `XX/2026` para numero de processo quando ausente;
- `R$ XX.XXX,XX` para preco ausente;
- `XX de XXXXX de 2026` para datas ausentes;
- `[CONTRATADA]`, `[CNPJ DA CONTRATADA]`, `[ENDERECO DA CONTRATADA]`, `[REPRESENTANTE LEGAL]` e `[CPF DO REPRESENTANTE]` para qualificacao nao informada.

Alternativas consideradas:

- Usar `nao informado` dentro das qualificacoes contratuais. Rejeitada como padrao principal porque a minuta deve funcionar como modelo preenchivel.
- Remover clausulas quando faltarem dados. Rejeitada porque a minuta precisa ser estruturalmente completa.

### Decision: Clausulas juridicas padronizadas serao marcadas como `FIXED`

Algumas clausulas devem ser tratadas como texto normativo padrao da minuta, nao como conteudo generativo. O template deve marcar esses blocos com metadados explicitos, por exemplo `<!-- FIXED_CLAUSE_START: CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS -->` e `<!-- FIXED_CLAUSE_END -->`. Dentro desses blocos, o modelo deve copiar fielmente o texto do template e apenas substituir placeholders quando houver dado valido no contexto.

As clausulas fixas obrigatorias incluem, no minimo:

- `CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS`;
- `CLAUSULA DECIMA QUARTA - DA ALTERACAO E REAJUSTE`;
- `CLAUSULA DECIMA QUINTA - DAS CONDICOES DE HABILITACAO`;
- `CLAUSULA DECIMA SEXTA - DA PUBLICIDADE`;
- `CLAUSULA DECIMA SETIMA - DOS CASOS OMISSOS`;
- `CLAUSULA DECIMA OITAVA - DO FORO`.

O prompt deve explicar que clausula `FIXED` e imutavel: nao pode ser reescrita, resumida, simplificada, reorganizada ou ter seus termos juridicos alterados. Caso o provider copie os comentarios de marcacao, a sanitizacao pode remove-los antes de persistir, mas o corpo textual da clausula deve permanecer identico ao template, salvo placeholders substituidos.

Alternativas consideradas:

- Tratar todas as clausulas como adaptaveis. Rejeitada porque clausulas juridicas padronizadas precisam de previsibilidade e revisao juridica centralizada.
- Marcar todo o contrato como `FIXED`. Rejeitada porque objeto, preco, execucao, pagamento e obrigacoes precisam se adaptar ao contexto.

### Decision: Preco ausente ou zero vira placeholder, nao valor valido

A clausula de preco deve sempre existir. Quando houver valor valido no contexto, o prompt deve orientar o uso desse valor. Quando o valor estiver ausente, vazio ou numericamente zero (`0`, `0,00`, `0.00`, `R$ 0,00`), o contexto deve marcar preco indisponivel e a minuta deve usar placeholder, sem apresentar zero como preco contratual.

Alternativas consideradas:

- Persistir `R$ 0,00` para refletir a SD. Rejeitada porque no fluxo atual esse valor representa ausencia de estimativa, nao preco real.
- Fazer o modelo estimar o preco com base no objeto. Rejeitada porque violaria a regra de nao invencao e poderia simular pesquisa inexistente.

### Decision: Obrigacoes priorizam TR e usam fallback por tipo

Quando houver conteudo de TR ou contexto compativel com TR, as clausulas de obrigacoes devem derivar prioritariamente dele, adaptando linguagem de "devera executar" para linguagem contratual como "obriga-se a". Quando nao houver TR, `minuta.instructions.md` deve conter ou referenciar blocos por tipo de contratacao equivalentes aos do TR:

- `apresentacao_artistica`;
- `prestacao_servicos_gerais`;
- `fornecimento_bens`;
- `obra_engenharia`;
- `locacao_equipamentos`;
- `eventos_gerais`.

O modelo deve selecionar o tipo predominante pelo objeto e contexto, adaptar itens compativeis e evitar misturar blocos sem necessidade.

Alternativas consideradas:

- Gerar obrigacoes livremente. Rejeitada porque obrigacoes sao area de alto risco de alucinacao.
- Exigir TR como pre-condicao para minuta. Rejeitada porque a minuta deve poder ser gerada somente com base na SD, usando placeholders e fallback conservador.

### Decision: Reaproveitamento de TR/ETP e contextual, nao estrutural

O prompt pode permitir reaproveitamento de objeto, justificativa, execucao e obrigacoes de TR/ETP para consistencia e economia de tokens. Esse conteudo deve ser convertido para linguagem contratual e nao pode levar headings de documentos anteriores para a minuta.

Alternativas consideradas:

- Copiar trechos de TR integralmente. Rejeitada porque TR e tecnico-operacional, enquanto minuta e contratual.
- Proibir reaproveitamento. Rejeitada porque reduziria consistencia entre documentos e aumentaria reescrita desnecessaria.

### Decision: Sanitizar por fronteiras contratuais e secoes proibidas

A sanitizacao deve ser estendida para `minuta`. Se a resposta vier com DFD, ETP ou TR antes da minuta, esse preambulo deve ser descartado. Depois de iniciado o contrato, a persistencia deve cortar ou remover headings como `DADOS DA SOLICITACAO`, `DOCUMENTO DE FORMALIZACAO DE DEMANDA`, `ESTUDO TECNICO PRELIMINAR`, `LEVANTAMENTO DE MERCADO`, `ANALISE DE ALTERNATIVAS`, `TERMO DE REFERENCIA`, `ESPECIFICACOES TECNICAS DO SERVICO` e outros blocos nao contratuais.

O sanitizer e defesa de armazenamento; o controle principal continua sendo receita, template e prompt.

Alternativas consideradas:

- Confiar apenas no prompt. Rejeitada porque os tipos documentais compartilham contexto e podem vazar estrutura entre si.
- Validar juridicamente cada clausula. Rejeitada por escopo; a minuta continua sujeita a validacao humana.

## Risks / Trade-offs

- [Minuta ficar generica demais sem TR] -> Mitigar com blocos por tipo de contratacao, placeholders e linguagem contratual conservadora.
- [Modelo copiar texto tecnico de TR sem adaptar] -> Mitigar nas instrucoes, exigindo linguagem de clausula e proibindo headings tecnicos.
- [Sanitizer remover clausulas validas por nome parecido] -> Cobrir com testes para minuta pura e para vazamento evidente de DFD/ETP/TR.
- [Provider reescrever clausula marcada como `FIXED`] -> Mitigar com instrucao explicita, marcadores de bloco no template e teste que compara o corpo das clausulas fixas contra o template apos substituir placeholders.
- [Placeholders demais reduzirem prontidao operacional] -> Aceitar o trade-off: a minuta e modelo juridico preenchivel, e seguranca contra invencao e prioridade.
- [Valor zero aparecer como preco] -> Normalizar valor antes do prompt e testar `R$ 0,00`, `0`, `0,00` e `0.00`.

## Migration Plan

1. Criar `minuta.instructions.md` e `minuta.template.md` em `apps/api/src/modules/documents/recipes`, incluindo marcadores `FIXED` nas clausulas juridicas padronizadas.
2. Registrar `minuta` no resolver de receitas.
3. Implementar montagem de prompt especifica para `minuta`, com estimativa normalizada, placeholders e contexto TR/ETP quando disponivel.
4. Estender a sanitizacao de rascunhos para preservar somente estrutura contratual de minuta.
5. Adicionar testes para receita, template, valores ausentes/zero, placeholders, obrigacoes e exclusao de secoes DFD/ETP/TR.

Rollback consiste em remover `minuta` do resolver de receitas, fazendo o tipo voltar ao comportamento generico. Nao ha migracao de banco.

## Open Questions

Nenhuma para a primeira implementacao.

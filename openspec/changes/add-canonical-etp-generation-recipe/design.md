## Context

O backend ja possui uma especializacao para `dfd`: o modulo `documents` resolve uma receita versionada, monta um prompt com template canonico, contexto estruturado do processo e instrucoes do operador, e depois sanitiza o conteudo persistido para remover secoes indevidas de `ETP` ou `TR`. Para `etp`, o fluxo ainda cai no prompt generico de documentos, apesar de `etp` ja ser um tipo suportado.

O arquivo de referencia anexado contem `DFD`, `ETP` e `TR` no mesmo `.docx`. Para esta change, o unico bloco valido como fonte estrutural e `ESTUDO TECNICO PRELIMINAR (ETP)`. A estrutura canonica extraida dele e:

- `INTRODUCAO`
- `NECESSIDADE DA CONTRATACAO`
- `DESCRICAO DA SOLUCAO E SEUS REQUISITOS`
- `LEVANTAMENTO DE MERCADO E ANALISE DE ALTERNATIVAS`, incluindo `Levantamento de Mercado`, `Analise de Alternativas`, alternativas e `Justificativa da Solucao Escolhida`
- `ESTIMATIVA DO VALOR DA CONTRATACAO`
- `ADEQUACAO ORCAMENTARIA`
- `SUSTENTABILIDADE E IMPACTOS`, incluindo impactos economico, social/cultural e ambiental
- `GESTAO E FISCALIZACAO DA CONTRATACAO`
- `CONCLUSAO E RECOMENDACAO`
- bloco final de local, data, responsavel e cargo

A secao de estimativa do exemplo e tambem o principal alerta: o texto parte de `R$ 0,00` na SD e tenta elaborar uma estimativa. A receita canonica deve inverter esse comportamento: `R$ 0,00` e valor ausente significam que nao ha estimativa disponivel.

## Goals / Non-Goals

**Goals:**

- Criar ativos backend `etp.instructions.md` e `etp.template.md` com estrutura e comportamento editorial fixos para ETP.
- Fazer `documentType=etp` resolver a receita no mesmo registry usado por `dfd`.
- Montar prompt de `etp` com contexto estruturado de processo, organizacao, departamentos e metadados extraidos da SD.
- Tratar valor ausente, `0`, `0,00`, `0.00` ou `R$ 0,00` como ausencia de estimativa.
- Impedir que a saida final de ETP contenha secoes de DFD ou TR.
- Permitir reaproveitamento editorial de contexto sobreposto com o DFD, sem importar headings ou estrutura de DFD.

**Non-Goals:**

- Alterar os tipos publicos suportados por geracao documental.
- Criar um novo endpoint ou uma rota especifica para ETP.
- Fazer pesquisa de mercado real, integrar fontes externas ou calcular estimativas automaticamente.
- Validar juridicamente o ETP final ou substituir revisao humana.
- Gerar `.docx` final nesta change.

## Decisions

### Decision: Reutilizar o padrao de receita versionada ja usado por DFD

`etp` deve entrar no mesmo mecanismo de `DocumentGenerationRecipe` usado por `dfd`, com dois assets carregados pelo backend: `etp.instructions.md` e `etp.template.md`. O resolver passa a retornar receita para `dfd` e `etp`, mantendo `tr` e `minuta` no prompt generico ate existirem receitas proprias.

Alternativas consideradas:

- Manter `etp` no prompt generico.
  Rejeitada porque nao resolve variacao estrutural nem risco de estimativa inventada.
- Embutir o prompt de ETP em TypeScript.
  Rejeitada porque dificulta revisao editorial e diverge do padrao ja adotado para DFD.

### Decision: O template define estrutura, as instrucoes definem limites de geracao

`etp.template.md` deve conter a estrutura completa extraida do ETP de referencia, usando placeholders e orientacoes curtas para conteudo dinamico. O template nao deve trazer fatos do caso FORRO TSUNAMI como conteudo fixo; esses dados devem vir do contexto do processo.

`etp.instructions.md` deve definir tom, profundidade, uso exclusivo do contexto, proibicao de invencao e politica para dados ausentes. A instrucao precisa dizer explicitamente que o modelo deve manter o documento estritamente como ETP e nao deve incluir DFD ou TR.

Alternativas consideradas:

- Colocar todas as regras no template.
  Rejeitada porque mistura forma documental com politicas editoriais e torna o modelo mais dificil de revisar.
- Deixar a estrutura somente nas instrucoes.
  Rejeitada porque reduz a previsibilidade dos headings gerados.

### Decision: Normalizar a estimativa antes de montar o prompt

O contexto de ETP deve ter um campo de disponibilidade de estimativa em vez de repassar cegamente o valor bruto da SD. A normalizacao deve consultar metadados extraidos como `totalValue`, `item.totalValue` ou campos equivalentes disponiveis em `sourceMetadata.extractedFields`.

Se o valor for ausente, vazio ou numericamente zero, incluindo representacoes como `0`, `0,00`, `0.00` e `R$ 0,00`, o contexto enviado ao modelo deve marcar a estimativa como indisponivel e orientar a redacao com `nao informado`, `nao consta no contexto` e `sera objeto de apuracao posterior`. O prompt nao deve apresentar zero como preco valido.

Alternativas consideradas:

- Deixar o modelo interpretar `R$ 0,00`.
  Rejeitada porque o comportamento atual demonstra risco de extrapolacao.
- Remover a secao de estimativa quando nao houver valor.
  Rejeitada porque a secao e obrigatoria e deve permanecer completa estruturalmente.

### Decision: Reaproveitamento de conteudo deve ser contextual, nao estrutural

Quando houver sobreposicao com DFD, como contexto, necessidade, objeto e justificativa, o prompt pode permitir que o modelo reutilize ou adapte trechos fornecidos como contexto. Esse reaproveitamento deve ser tratado como economia editorial, nao como importacao de secoes: o resultado final deve continuar seguindo apenas os headings do ETP.

Na primeira implementacao, o reaproveitamento pode vir do proprio contexto estruturado da SD/processo, que ja alimenta DFD e ETP. Se futuramente o fluxo carregar um DFD ja gerado, ele deve ser incluido como fonte auxiliar claramente rotulada, nunca como template.

Alternativas consideradas:

- Buscar e injetar automaticamente qualquer DFD existente como parte obrigatoria.
  Rejeitada para o primeiro passo porque adiciona dependencia de consulta/lifecycle de outro documento sem ser necessaria para cumprir o requisito principal.
- Proibir qualquer reutilizacao textual.
  Rejeitada porque reduz consistencia entre documentos e aumenta custo de tokens sem ganho claro.

### Decision: Sanitizar ETP por fronteiras documentais

A sanitizacao deve ser estendida para `etp`. Se a resposta contiver conteudo antes do heading de ETP, esse preambulo deve ser descartado quando representar DFD ou comentario meta. Depois de iniciado o ETP, a persistencia deve cortar headings de `DFD`, `DOCUMENTO DE FORMALIZACAO DE DEMANDA`, `TR` ou `TERMO DE REFERENCIA`.

O sanitizer nao substitui as instrucoes editoriais, mas protege o armazenamento contra vazamento estrutural evidente.

Alternativas consideradas:

- Confiar apenas no prompt.
  Rejeitada porque a implementacao de DFD ja reconhece a necessidade de defesa antes da persistencia.
- Tentar validar semanticamente todo o Markdown.
  Rejeitada por ser mais caro e fragil; a primeira protecao deve focar em fronteiras documentais claras.

## Risks / Trade-offs

- [Template ficar excessivamente preso ao caso de referencia] -> Usar apenas headings e profundidade editorial do ETP, mantendo dados concretos como contexto dinamico.
- [Modelo ainda mencionar pesquisa de mercado sem fonte] -> Reforcar no prompt que pesquisa nao constante no contexto deve ser descrita como etapa posterior e cobrir isso em teste de composicao do prompt.
- [Sanitizer remover conteudo demais quando o modelo abre com heading errado] -> Escrever testes com DFD antes do ETP, TR depois do ETP e ETP puro para calibrar os limites.
- [Campos de valor da SD variarem entre fontes] -> Centralizar a normalizacao em helper pequeno e testado, aceitando os campos conhecidos hoje e fallbacks por nome quando forem adicionados.

## Migration Plan

1. Criar `etp.instructions.md` e `etp.template.md` em `apps/api/src/modules/documents/recipes`.
2. Registrar a receita de `etp` no resolver de receitas.
3. Implementar contexto/prompt especifico de ETP com normalizacao de estimativa.
4. Estender sanitizacao de rascunhos para `etp`.
5. Adicionar testes unitarios para receita, prompt, valor ausente/zero e exclusao de DFD/TR.

Rollback consiste em remover a receita de `etp` do resolver, fazendo o tipo voltar ao prompt generico. Nao ha migracao de banco.

## Open Questions

Nenhuma para a primeira implementacao.

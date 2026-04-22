## Context

O backend ja possui um fluxo generico de geracao documental em `apps/api/src/modules/documents` que recebe `processId`, `documentType` e instrucoes opcionais, monta um prompt simples e delega a chamada para o provider generico de text generation. Esse desenho foi suficiente para introduzir a fundacao de geracao, mas ainda nao oferece um contrato editorial forte para `dfd`.

O arquivo de referencia anexado pelo usuario traz tres blocos no mesmo `.docx`: `DFD`, `ETP` e `TR`. Para esta change, o insumo valido e apenas a primeira parte, `DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)`, que explicita uma estrutura recorrente com cabecalho de solicitacao, secoes narrativas e bloco final de assinatura. O desafio e transformar essa estrutura em um ativo reutilizavel pelo backend sem criar dependencia de runtime em uma skill do Codex desktop.

## Goals / Non-Goals

**Goals:**
- Introduzir uma receita canonica de geracao para `dfd`, composta por instrucoes editoriais e por um modelo Markdown derivado somente do bloco DFD do documento de referencia.
- Fazer a rota de geracao documental reutilizar essa receita quando `documentType=dfd`, combinando-a com o contexto do processo, da organizacao e do departamento associado.
- Garantir que a saida de `dfd` permaneça restrita ao documento DFD, sem incorporar secoes de `ETP` ou `TR`.
- Deixar um modelo `.md` revisavel dentro da change para servir de base objetiva para a implementacao posterior.

**Non-Goals:**
- Redesenhar o provider generico de text generation ou acoplar o dominio a nomes especificos da OpenAI.
- Implementar, nesta change, receitas equivalentes para `etp`, `tr` ou `minuta`.
- Gerar `.docx`, exportacao de arquivo final ou fluxo de aprovacao/revisao editorial.
- Executar uma skill do Codex desktop em runtime dentro da API.

## Decisions

### Decision: Reutilizar a rota generica de geracao documental

O entrypoint deve continuar sendo o fluxo atual de geracao documental baseado em `processId` e `documentType`, sem introduzir uma rota paralela exclusiva para DFD. Isso preserva a semantica atual do modulo `documents` e limita a mudanca a uma especializacao do builder de prompt para o caso `dfd`.

Alternativas consideradas:

- Criar uma rota nova como `POST /api/processes/:id/dfd`.
  Rejeitada porque duplicaria autorizacao, lifecycle e persistencia ja existentes no modulo `documents`.
- Fazer a geracao de DFD sair do modulo `documents` e entrar em `processes`.
  Rejeitada porque o resultado continua sendo um documento gerado vinculado ao processo.

### Decision: Tratar a “skill” como ativo textual versionado do backend

A implementacao deve materializar a skill como um arquivo Markdown ou texto versionado pelo repositorio e carregado pelo backend, em vez de depender de `.codex/skills/.../SKILL.md` como unico runtime source. O backend pode ate compartilhar o mesmo conteudo com uma skill do Codex no futuro, mas a API precisa consumir um ativo proprio e estavel.

Alternativas consideradas:

- Ler diretamente uma skill do diretório `.codex/skills` durante a requisicao.
  Rejeitada porque isso acopla a API a um ambiente de desenvolvimento especifico e nao a um asset de aplicacao.
- Embutir toda a instrucao como string inline em TypeScript.
  Rejeitada porque dificulta revisao editorial e manutencao do prompt.

### Decision: Criar uma receita de DFD com dois ativos complementares

A receita canonica de `dfd` deve ser formada por:

- um arquivo de instrucoes editoriais, com o papel da skill
- um arquivo de modelo Markdown, com a forma esperada do documento

O prompt final para a OpenAI deve ser montado a partir desses dois ativos, mais o contexto normalizado do processo e as instrucoes do operador. Essa separacao permite revisar estilo e estrutura de forma independente.

Alternativas consideradas:

- Manter apenas um prompt unico sem template estruturado.
  Rejeitada porque a saida tende a variar demais entre geracoes.
- Manter apenas o template, sem instrucoes editoriais.
  Rejeitada porque o modelo sozinho nao define tom, limites de invencao nem politica para dados ausentes.

### Decision: Derivar o modelo apenas do bloco DFD do documento anexado

O modelo `.md` deve refletir apenas as secoes observadas no bloco DFD do arquivo de referencia:

- dados da solicitacao
- contexto e necessidade da demanda
- objeto da contratacao
- justificativa e relevancia da contratacao
- requisitos essenciais para a contratacao
- assinatura/fecho

Nao devem entrar no template headings, secoes nem linguagem especifica de `ETP` ou `TR`, mesmo que coexistam no mesmo anexo.

Alternativas consideradas:

- Usar o `.docx` inteiro como modelo-base.
  Rejeitada porque misturaria tres tipos documentais distintos e contaminaria a saida de DFD.
- Reduzir o DFD a um formulario curto.
  Rejeitada porque perderia a densidade narrativa demonstrada pelo documento de referencia.

### Decision: Resolver contexto de DFD com prioridade para metadados estruturados do processo

O builder de prompt para `dfd` deve montar um contexto normalizado usando, em ordem de prioridade:

1. `process.sourceMetadata.extractedFields`, quando existir
2. campos persistidos do `process`
3. departamento vinculado ao processo
4. dados da organizacao

Essa ordem permite preencher campos como unidade orcamentaria, numero da solicitacao e responsavel sem obrigar que todo processo tenha nascido do intake por PDF. Quando algum dado nao puder ser determinado com seguranca, o contexto deve explicitar a ausencia em vez de inventar.

Alternativas consideradas:

- Exigir que apenas processos originados de SD possam gerar DFD.
  Rejeitada porque o requisito do usuario e gerar a partir de `process`, nao apenas de um subtipo de origem.
- Inventar valores faltantes silenciosamente.
  Rejeitada porque compromete a confiabilidade do documento gerado.

## Risks / Trade-offs

- [O modelo pode ficar excessivamente aderente ao caso de Carnaval/Pureza] -> Separar a estrutura documental dos detalhes materiais do caso concreto e usar placeholders/contexto dinamico no template.
- [A expressao “skill” pode sugerir dependencia de runtime no Codex] -> Adotar o backend como source of truth dos ativos de prompt e tratar qualquer skill do Codex como espelho opcional.
- [Processos antigos podem nao ter todos os campos esperados pelo DFD] -> Definir fallbacks explicitos com departamento, organizacao e marcadores de dado ausente.
- [Uma receita muito engessada pode reduzir a qualidade de variacoes futuras] -> Manter template e instrucoes em arquivos separados e versionados para ajustes incrementais.

## Migration Plan

1. Criar os ativos canonicos de receita para `dfd` a partir do bloco DFD do anexo de referencia.
2. Introduzir um resolvedor de contexto de DFD no modulo `documents`, enriquecendo o prompt com dados do processo, departamento e organizacao.
3. Fazer o fluxo de `documentType=dfd` usar a receita canonica antes de chamar o provider generico de text generation.
4. Cobrir o comportamento com testes de prompt/composicao e de resultado persistido.

Rollback consiste em voltar o builder de `dfd` para o prompt generico atual. Nenhuma migracao de banco e necessaria.

## Open Questions

- Nenhuma para a primeira implementacao. O source of truth da receita de `dfd` sera um asset versionado do backend; qualquer espelhamento futuro para `.codex/skills` fica fora do escopo inicial.

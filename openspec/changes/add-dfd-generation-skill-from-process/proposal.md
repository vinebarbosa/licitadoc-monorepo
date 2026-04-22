## Why

A geracao de documentos hoje usa um prompt generico com dados da organizacao e do processo, o que e suficiente para prototipacao, mas ainda nao garante que um `DFD` saia com a estrutura, densidade e linguagem esperadas para um processo administrativo real. Agora que existe um exemplo concreto de DFD anexado ao projeto, faz sentido transformar esse formato em uma receita canonica para gerar DFDs a partir de um processo salvo, sem misturar conteudo de ETP ou TR.

## What Changes

- Introduzir uma receita de geracao de DFD composta por uma skill textual e por um modelo Markdown canonico derivado apenas da secao `DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)` do arquivo de referencia anexado.
- Ajustar o fluxo de geracao de documentos para que requisicoes de `dfd` usem a receita canonica + contexto do processo + contexto da organizacao + instrucoes opcionais do operador antes de chamar a API da OpenAI.
- Definir limites explicitos para a saida gerada, exigindo que a resposta final siga somente o formato do DFD e nao incorpore secoes de `ETP` ou `TR`, ainda que essas secoes existam no arquivo de referencia.
- Registrar no change um modelo `.md` de referencia para o DFD, de modo que a implementacao futura tenha um contrato editorial claro para a skill e para o prompt builder da API.

## Capabilities

### New Capabilities
- `document-generation-recipes`: receita versionada de geracao por tipo documental, composta por instrucoes editoriais e template Markdown reutilizavel pelo backend.

### Modified Capabilities
- `document-generation`: geracao de `dfd` passa a ser montada a partir de uma receita canonica orientada por processo, em vez de depender apenas do prompt generico atual.

## Impact

- Afeta `apps/api/src/modules/documents`, em especial o builder de prompt e o fluxo de geracao do tipo `dfd`.
- Introduz ativos de prompt/template no repositorio, incluindo uma skill textual e um modelo `.md` para DFD.
- Reforca o acoplamento intencional entre o documento gerado e o `process` salvo, preservando o uso do provider generico de text generation por tras da API da OpenAI.
- Exige testes para garantir que a saida de `dfd` siga a estrutura canonica e nao vaze secoes de `ETP` ou `TR`.

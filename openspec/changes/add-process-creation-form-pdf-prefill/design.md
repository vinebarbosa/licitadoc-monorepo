## Context

O app web ja possui a listagem real de processos em `/app/processos`, CTA para `/app/processo/novo` na listagem e na sidebar, arquitetura modular em `apps/web/src/modules/processes`, cliente gerado `@licitadoc/api-client` e componentes de formulario compartilhados. O backend ja expoe `POST /api/processes/` para criacao manual e tambem endpoints de intake por Solicitacao de Despesa em texto/PDF, mas esses endpoints criam o processo diretamente a partir da extracao no backend.

O novo fluxo precisa dar controle ao usuario antes da criacao. O PDF TopDown deve ser importado no formulario, processado no browser e transformado em sugestoes editaveis. O backend continua sendo a autoridade de validacao e persistencia, mas nao deve ser usado como a primeira experiencia de extracao neste fluxo.

## Goals / Non-Goals

**Goals:**

- Expor uma pagina protegida de criacao de processo em `/app/processo/novo`.
- Permitir criacao manual com os campos aceitos por `POST /api/processes/`.
- Permitir importar um PDF TopDown, extrair texto no frontend e pre-preencher campos editaveis.
- Mostrar estados de leitura, sucesso parcial, avisos, falhas de extracao e dados obrigatorios faltantes.
- Carregar departamentos e, para admins, organizacoes pelas APIs existentes.
- Criar o processo somente apos o usuario revisar e enviar o formulario.

**Non-Goals:**

- Criar novo endpoint backend.
- Alterar regras de permissao, escopo de organizacao, conflito de numero ou validacao de departamentos.
- Persistir o arquivo PDF bruto como parte deste fluxo.
- Substituir o endpoint backend de intake por PDF, que continua existindo para uso futuro ou alternativo.
- Implementar detalhe de processo alem do redirecionamento para uma rota esperada apos criacao.

## Decisions

### Decision: Criacao final usa `POST /api/processes/`

O formulario enviara o payload manual para `POST /api/processes/`, mesmo quando os dados vierem de um PDF importado. Isso preserva as correcoes feitas pelo usuario, evita depender da segunda extracao no backend e usa o contrato de criacao que ja aceita os campos finais do processo.

Alternativas consideradas:

- Usar `POST /api/processes/from-expense-request/pdf` no submit: preserva upload e source-file metadata, mas recria o processo a partir da extracao backend e nao aceita todos os campos corrigidos pelo usuario.
- Criar endpoint novo de "preview" ou "parse": melhoraria consistencia entre backend e frontend, mas contraria o objetivo imediato de extracao no front e aumenta escopo.

### Decision: Parser TopDown fica no modulo web de processos

A extracao deve ser isolada em helpers testaveis de `apps/web/src/modules/processes/model` ou `apps/web/src/modules/processes/api` conforme a fronteira escolhida na implementacao. O parser deve produzir um objeto intermediario com valores sugeridos, avisos e campos sem confianca suficiente. A UI nunca deve tratar uma extracao como dado final.

Alternativas consideradas:

- Importar parser de `apps/api`: viola fronteiras de pacote e acopla runtime browser ao backend.
- Criar pacote compartilhado agora: reduz duplicacao, mas amplia escopo e exige cuidado extra com erros HTTP/backend. Pode ser avaliado depois se a divergencia entre parsers virar risco relevante.

### Decision: Leitura de PDF no browser com dependencia lazy-loaded

O frontend deve usar uma biblioteca de extracao de texto de PDF compativel com browser, preferencialmente `pdfjs-dist`, ja usado no backend. A importacao deve ser carregada sob demanda para nao pesar a listagem ou a abertura inicial do app.

Alternativas consideradas:

- Usar FileReader sem biblioteca: nao extrai texto de PDF de forma confiavel.
- Enviar PDF ao backend so para extrair texto: reduz bundle, mas volta ao fluxo que o usuario quer evitar antes da revisao.

### Decision: Formulario unico com modo manual e modo importado

A pagina deve apresentar uma unica superficie de formulario. A importacao do PDF apenas popula campos e mostra avisos; o usuario pode editar todos os campos antes do submit. Isso evita dois fluxos mentais e facilita manter validacao, erro e sucesso em um lugar.

Campos esperados:

- `type`
- `processNumber`
- `externalId`
- `issuedAt`
- `object`
- `justification`
- `responsibleName`
- `status`, com default local alinhado ao backend para criacao
- `organizationId`, somente quando o ator for admin
- `departmentIds`, multi-select obrigatorio
- `sourceKind`, `sourceReference` e `sourceMetadata` quando a criacao vier de PDF importado

### Decision: Organizacao e departamento continuam guiados por APIs existentes

Admins devem escolher uma organizacao antes de selecionar departamentos quando necessario. Atores `organization_owner` e `member` usam a organizacao da sessao e veem apenas departamentos retornados por `GET /api/departments/`. A importacao pode sugerir departamento por codigo de unidade orcamentaria ou nome, mas deve deixar a selecao editavel e obrigatoria.

Alternativas consideradas:

- Confiar integralmente no departamento extraido do PDF: arriscado porque o frontend so conhece ids por meio da API e o backend validara escopo de qualquer forma.
- Permitir submit sem departamento quando o PDF tiver unidade orcamentaria: incompatibiliza com `POST /api/processes/`, que exige ao menos um `departmentId`.

## Risks / Trade-offs

- [Risk] O parser frontend pode divergir do parser backend existente. -> Mitigacao: manter parser pequeno, coberto por fixtures de texto/PDF TopDown, e tratar extracao como sugestao revisavel, nao como autoridade.
- [Risk] `pdfjs-dist` pode aumentar o bundle. -> Mitigacao: carregar a dependencia apenas quando o usuario importar um PDF.
- [Risk] PDFs escaneados, criptografados ou sem texto selecionavel nao serao lidos. -> Mitigacao: mostrar erro claro e manter o formulario manual disponivel.
- [Risk] Processo criado via fluxo manual nao preserva o binario do PDF em object storage. -> Mitigacao: registrar metadados de origem no payload quando disponiveis e deixar persistencia do arquivo para uma mudanca futura, se o produto exigir auditoria do arquivo original.
- [Risk] Admin pode selecionar organizacao e departamento inconsistentes. -> Mitigacao: filtrar/sinalizar departamentos pela organizacao selecionada quando os dados disponiveis permitirem e confiar na validacao backend como barreira final.

## Context

`tmp/documento-novo.tsx` contem a UI validada de `Novo Documento`, mas ela ainda vive fora da arquitetura atual, usa lista mockada de processos e simula a criacao com timeout local. Ao mesmo tempo, a web app nova ja expoe links estaveis para `/app/documento/novo?tipo=...&processo=...`, especialmente a partir do detalhe de processo, mas a rota ainda nao esta registrada.

No backend, o dominio de documentos ja suporta criacao real por `POST /api/documents` e leitura/listagem de documentos. O endpoint atual recebe `processId`, `documentType` e `instructions`, gera o nome automaticamente como `<TIPO> - <processNumber>`, executa a geracao e devolve o documento criado. Isso cobre a maior parte do fluxo, mas nao preserva o campo editavel de nome presente na UI validada.

O usuario pediu explicitamente para nao reinventar a interface. A migracao precisa preservar o layout aprovado, trocar apenas dados simulados por dados reais e manter a compatibilidade com os deep links ja emitidos por outras telas.

## Goals / Non-Goals

**Goals:**

- Migrar `tmp/documento-novo.tsx` para `apps/web/src/modules/documents` dentro da arquitetura atual.
- Registrar a rota protegida `/app/documento/novo` e honrar `?tipo=` e `?processo=` como estado inicial da tela.
- Popular o seletor com processos reais visiveis ao ator autenticado usando a API atual de processos.
- Submeter a criacao real de documento com feedback de carregamento/erro e com nome customizado opcional quando informado pelo usuario.
- Manter o fallback de nome automatico quando o usuario nao personalizar o nome.
- Cobrir o fluxo com testes React/MSW e Playwright.

**Non-Goals:**

- Redesenhar a experiencia visual validada de `Novo Documento`.
- Migrar ou implementar por completo as telas de edicao/preview de documento.
- Alterar o dominio de geracao alem do necessario para suportar o nome customizado opcional.
- Criar um endpoint exclusivo para o seletor de processos se a listagem atual ja atender ao fluxo.

## Decisions

### Decision: A tela migrada fica no modulo de documents, com adaptadores proprios e sem dependencia runtime de `tmp/`

O fluxo deve ser implementado como pagina/componente publico do modulo `documents`, com `api/`, `model/`, `ui/`, `pages/` e `index.ts` seguindo o padrao ja usado pela listagem de documentos. `tmp/documento-novo.tsx` permanece apenas como referencia visual.

Alternativas consideradas:

- Importar diretamente do `tmp/`: viola os limites arquiteturais do frontend e perpetua a dependencia de codigo legado.
- Colocar a tela dentro do modulo de `processes`: o ownership do fluxo e do endpoint de criacao e do modulo de documentos.

### Decision: O seletor usa a listagem de processos existente, com pre-selecao por `processo=<processId>`

O dropdown deve consumir a listagem de processos ja existente, reaproveitando os campos `id`, `processNumber` e `object` para montar opcoes e para resolver a pre-selecao enviada por outras telas. O `tipo` vindo da query string inicializa a selecao do tipo e o `processo` inicializa o processo assim que os dados forem carregados.

Alternativas consideradas:

- Criar endpoint dedicado so para o picker de processos: adiciona custo de API sem necessidade comprovada.
- Manter um array local mockado: contraria o objetivo da migracao e quebra o escopo por ator autenticado.

### Decision: O nome do documento passa a ser um override opcional do contrato de criacao

Para preservar o campo editavel validado pelo produto, `POST /api/documents` deve aceitar um campo opcional de nome. Quando o usuario informar um nome nao vazio, o backend persiste esse valor; quando omitir ou enviar apenas espacos, o backend continua usando o nome padrao derivado de `documentType` + `process.processNumber`.

Alternativas consideradas:

- Ignorar o campo no frontend e deixar o backend sempre gerar o nome: preserva a API atual, mas torna a UI enganosa.
- Persistir o nome apenas no cliente e corrigi-lo depois na tela de edicao: introduz divergencia imediata entre o que o usuario confirma e o que o sistema grava.

### Decision: O frontend deriva o nome inicial com a mesma regra padrao do backend

Ao selecionar tipo e processo, a tela deve sugerir automaticamente o nome inicial usando o mesmo padrao do backend (`DFD - PE-2024-045`, por exemplo). Isso preserva a UX da tela legada e reduz surpresa quando o usuario nao faz override manual.

Alternativas consideradas:

- Manter o mock antigo baseado no objeto do processo: diverge do nome real hoje persistido no backend.
- Esperar a resposta do backend para mostrar o nome: piora a experiencia e impede edicao previa.

### Decision: O pos-criacao precisa navegar para um destino estavel, sem depender de simulacao local

Depois do sucesso, a pagina deve sair do estado de criacao local e navegar para o destino canonico do documento criado. O destino preferencial e `/app/documento/:documentId`, mas a implementacao precisa confirmar que essa rota ja existe ou definir um fallback estavel, em vez de reproduzir o mock legado que navegava para um id ficticio.

Alternativas consideradas:

- Navegar para um id mockado como no arquivo temporario: invalido no fluxo real.
- Permanecer na pagina sem navegar: quebra a expectativa do CTA `Criar e Editar`.

## Risks / Trade-offs

- [Risk] O fluxo depende de frontend, API e cliente gerado, aumentando a superficie de regressao. -> Mitigacao: dividir a implementacao em contrato backend, adaptadores web, pagina e cobertura de testes.
- [Risk] A listagem de processos pode nao trazer todos os registros necessarios para o seletor em um unico request. -> Mitigacao: usar parametros de pagina amplos para o picker ou ajustar minimamente o contrato apenas se o limite atual se mostrar insuficiente.
- [Risk] O campo de nome customizado pode conflitar com nomes gerados existentes. -> Mitigacao: manter o nome como texto livre e continuar usando `documentId` como identidade canonica do documento.
- [Risk] A rota canonica de detalhe do documento pode ainda nao estar disponivel. -> Mitigacao: tratar o destino pos-criacao como decisao explicita da implementacao e validar isso com teste e2e.

## Migration Plan

1. Ajustar o contrato de criacao de documentos para aceitar nome customizado opcional e regenerar `@licitadoc/api-client` se necessario.
2. Criar adaptadores web para consultar processos e executar a mutacao de criacao com tratamento explicito de erro.
3. Migrar a UI validada para o modulo `documents`, registrando `/app/documento/novo` e ligando os query params ao estado inicial.
4. Conectar submissao, navegacao pos-sucesso e estados de carregamento/erro.
5. Cobrir o fluxo com testes unitarios/MSW e Playwright.

## Open Questions

- Qual e o destino definitivo pos-criacao enquanto a rota `/app/documento/:documentId` ainda nao aparece no router atual?
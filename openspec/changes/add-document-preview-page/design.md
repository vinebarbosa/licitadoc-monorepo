## Context

`apps/web` ja possui o modulo `documents`, a listagem protegida em `/app/documentos`, helpers que apontam "Visualizar" para `/app/documento/:documentId/preview`, e o cliente gerado para `GET /api/documents/:documentId`. O backend ja expõe `draftContent`, `type`, `status`, `processId`, `processNumber`, responsaveis e timestamps no detalhe do documento, entao a primeira versao da pagina pode ser implementada como experiencia frontend sobre esse contrato existente.

A nova pagina deve seguir a arquitetura modular atual: a rota fica centralizada em `apps/web/src/app/router.tsx`, a pagina/entrada publica vive em `apps/web/src/modules/documents/pages`, o comportamento reutilizavel fica em `api`, `model` e `ui` do proprio modulo, e os componentes visuais devem reutilizar os primitivos de `apps/web/src/shared/ui`.

## Goals / Non-Goals

**Goals:**

- Registrar `/app/documento/:documentId/preview` dentro do shell protegido.
- Buscar o detalhe do documento pelo adaptador do modulo de documentos, baseado no cliente gerado.
- Renderizar uma pagina de leitura com cabecalho, metadados, status, link para processo relacionado e conteudo do rascunho.
- Cobrir estados de carregamento, erro recuperavel, nao encontrado/sem acesso, documento em geracao, documento com falha e documento completo sem conteudo.
- Atualizar fixtures MSW e testes frontend para validar a rota e os principais estados.

**Non-Goals:**

- Implementar edicao, exportacao, download, duplicacao ou exclusao de documentos.
- Criar novo endpoint ou alterar o schema de documentos, salvo se a implementacao revelar divergencia real entre API e cliente gerado.
- Transformar o preview em renderizador completo de PDF/DOCX.
- Reestruturar a listagem de documentos ou o fluxo de criacao.

## Decisions

### Decision: Implementar a pagina dentro do modulo `documents`

A entrada publica deve ser `DocumentPreviewPage`, exportada por `apps/web/src/modules/documents/index.ts`, com UI e helpers privados no proprio modulo. O router apenas importa a pagina e registra a rota protegida com breadcrumbs estaticos; quando necessario, a pagina pode usar dados carregados para ajustar cabecalho interno.

Alternativas consideradas:

- Colocar a pagina no router ou em `shared`: reduziria a coesao do workflow de documentos.
- Criar um modulo novo so para preview: adicionaria uma fronteira artificial para um caso que pertence diretamente a documentos.

### Decision: Reaproveitar `GET /api/documents/:documentId`

O adaptador `useDocumentDetail(documentId)` deve encapsular `useGetApiDocumentsDocumentid` e expor o detalhe para a UI. Isso mantem chamadas geradas isoladas no modulo e evita novo contrato de API para dados que ja existem.

Alternativas consideradas:

- Usar diretamente o hook gerado na UI: funciona, mas vaza nomes gerados e dificulta ajustes futuros.
- Buscar a listagem e filtrar o documento no frontend: nao garante `draftContent` e dependeria de payload resumido.
- Criar endpoint especifico de preview: aumenta superficie de API sem necessidade atual.

### Decision: Renderizar o rascunho como preview textual seguro

O conteudo gerado deve ser exibido como leitura read-only em uma superficie com aparencia de documento, preservando quebras de linha, espacos e hierarquia textual basica do `draftContent`. A primeira versao nao deve interpretar HTML nem executar conteudo vindo do backend; se houver formatacao Markdown, ela pode ser apresentada de forma legivel sem exigir uma dependencia nova de renderer.

Alternativas consideradas:

- Renderizar HTML/Markdown completo com `dangerouslySetInnerHTML`: aumenta risco de seguranca e exige sanitizacao explicita.
- Adicionar biblioteca de Markdown agora: pode ser util depois, mas nao e necessaria para entregar preview seguro do texto persistido.
- Construir exportacao PDF/DOCX: extrapola a necessidade de visualizacao no app.

### Decision: Estados operacionais devem ocupar a propria pagina, nao toasts

Carregamento, erro, documento em geracao, falha de geracao e ausencia de conteudo devem aparecer como estados persistentes na pagina, com acoes claras de voltar, tentar novamente ou acessar o processo. Toasts nao devem ser o mecanismo primario para explicar por que nao ha preview.

Alternativas consideradas:

- Redirecionar automaticamente para a listagem quando nao houver conteudo: esconderia a razao do problema.
- Mostrar apenas uma pagina vazia enquanto o documento gera: deixa o usuario sem contexto e sem proximo passo.

## Risks / Trade-offs

- [Risk] `draftContent` pode conter Markdown complexo e a primeira versao textual nao reproduzir toda a formatacao esperada. -> Mitigacao: preservar quebras e hierarquia textual basica agora, deixando renderer rico para change futura se o produto exigir.
- [Risk] A fixture ou o cliente gerado podem estar defasados em relacao ao schema real de detalhe. -> Mitigacao: validar tipos durante implementacao e regenerar o cliente somente se houver divergencia confirmada.
- [Risk] Usuarios podem esperar acoes de exportacao no preview. -> Mitigacao: manter o escopo de leitura claro na UI e nao apresentar comandos sem contrato implementado.
- [Risk] Documentos em geracao podem mudar para completo depois que a pagina abriu. -> Mitigacao: oferecer retry/refetch manual e deixar polling automatico como melhoria futura, a menos que ja exista padrao local para isso.

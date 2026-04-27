## Context

A pagina de preview criada em `add-document-preview-page` exibe `draftContent` de forma segura como texto read-only, preservando quebras de linha em um `<pre>`. Esse comportamento evita XSS, mas nao interpreta a estrutura Markdown que os rascunhos gerados usam para titulos, listas, tabelas, enfases e secoes. A evolucao deve trocar apenas a camada de apresentacao do conteudo concluido, mantendo rota, metadados e estados operacionais do preview.

## Goals / Non-Goals

**Goals:**

- Renderizar `draftContent` Markdown no preview de documentos concluidos.
- Suportar Markdown comum e GitHub Flavored Markdown suficiente para documentos administrativos, incluindo tabelas.
- Manter HTML bruto desabilitado ou escapado, sem `dangerouslySetInnerHTML`.
- Preservar os estados atuais para carregamento, erro, documento em geracao, falha e documento sem conteudo.
- Cobrir renderizacao Markdown e protecao contra HTML perigoso com testes.

**Non-Goals:**

- Alterar o contrato de `GET /api/documents/:documentId`.
- Implementar edicao visual, exportacao, impressao ou download.
- Renderizar anexos, imagens remotas ou arquivos externos dentro do preview.
- Criar um editor Markdown ou persistir alteracoes feitas no preview.

## Decisions

### Decision: Usar `react-markdown` com `remark-gfm`

O preview deve renderizar Markdown com `react-markdown` e habilitar GitHub Flavored Markdown via `remark-gfm` para tabelas, listas de tarefa e outras extensoes comuns. A integracao fica isolada em um componente do modulo `documents`, por exemplo `DocumentMarkdownPreview`, para manter a pagina de preview focada em estado/dados e facilitar ajustes de estilo.

Alternativas consideradas:

- Implementar parser proprio: aumenta risco e complexidade em uma area ja resolvida por biblioteca madura.
- Manter `<pre>` e aplicar CSS: nao transforma titulos, listas e tabelas em semantica visual real.
- Usar renderer que produz HTML string: exigiria sanitizacao manual mais delicada.

### Decision: Nao habilitar HTML bruto no Markdown

O renderer nao deve incluir `rehype-raw` nem usar `dangerouslySetInnerHTML`. HTML embutido no `draftContent` deve aparecer escapado/removido conforme o comportamento seguro do renderer, e nao pode criar elementos executaveis como `<script>`, handlers inline ou iframes.

Alternativas consideradas:

- Sanitizar HTML bruto com allowlist: pode ser valido no futuro, mas aumenta superficie de seguranca sem necessidade para documentos gerados.
- Permitir HTML por confianca no provedor: o conteudo e persistido e pode atravessar varias etapas, entao a UI deve tratar como nao confiavel.

### Decision: Estilizar Markdown com componentes controlados

O componente de preview deve mapear elementos Markdown para componentes/elementos React com classes locais: headings, paragrafos, listas, tabelas, links, blockquotes e codigo. O estilo deve manter a superficie de "documento" existente, com largura legivel, espacamento consistente e comportamento responsivo para tabelas largas.

Alternativas consideradas:

- Adicionar plugin global de tipografia: pode afetar estilos fora do preview e ampliar escopo.
- Aceitar estilos default do browser: entrega semantica, mas tende a ficar desalinhado com o design system.

## Risks / Trade-offs

- [Risk] A nova dependencia aumenta o bundle do web app. -> Mitigacao: usar bibliotecas pequenas e maduras, mantendo a dependencia restrita ao preview.
- [Risk] Tabelas grandes podem quebrar o layout em telas estreitas. -> Mitigacao: envolver tabelas renderizadas em container com overflow horizontal.
- [Risk] Markdown gerado pode incluir HTML bruto esperando renderizacao. -> Mitigacao: priorizar seguranca e exibir/ignorar HTML bruto, documentando que a estrutura deve ser expressa em Markdown.
- [Risk] Links em Markdown podem apontar para destinos inseguros. -> Mitigacao: preservar transformacao segura de URLs do renderer e aplicar `rel` adequado quando links abrirem nova navegacao.

## Why

O preview de documento precisa mostrar o `draftContent` como documento formatado, nao como texto cru. Os rascunhos gerados usam Markdown para titulos, listas, tabelas e enfases, entao renderizar esse Markdown melhora a revisao do documento e aproxima a tela do formato que o usuario espera ler.

## What Changes

- Renderizar o conteudo Markdown do documento no preview em vez de exibi-lo dentro de um bloco textual simples.
- Preservar seguranca: Markdown vindo do backend nao deve executar HTML bruto, scripts ou atributos perigosos.
- Suportar elementos comuns de documentos administrativos: titulos, paragrafos, listas, numeracao, enfase, links, citacoes, codigo inline/blocos e tabelas quando a biblioteca escolhida suportar.
- Manter os estados existentes do preview para carregamento, erro, documento em geracao, falha e documento sem conteudo.
- Adicionar cobertura de testes para garantir renderizacao Markdown e bloqueio de HTML perigoso.

## Capabilities

### New Capabilities
- `web-document-preview-markdown`: Define como o preview de documento renderiza Markdown armazenado com seguranca e estilo de leitura.

### Modified Capabilities

## Impact

- Affected frontend: `apps/web/src/modules/documents`, testes React do preview, fixtures MSW e possivel cobertura Playwright.
- Dependencies: pode adicionar uma dependencia frontend de renderizacao Markdown e, se necessario, sanitizacao/plug-ins compatíveis com React.
- UX: o preview passa a apresentar hierarquia visual real do documento gerado, reduzindo friccao na revisao.
- Security: o renderer deve desabilitar ou sanitizar HTML bruto para evitar XSS via conteudo gerado/persistido.

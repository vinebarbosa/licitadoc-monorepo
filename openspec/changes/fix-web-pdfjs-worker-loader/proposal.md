## Why

Ao selecionar um PDF no navegador, a importacao falha com `Error: No "GlobalWorkerOptions.workerSrc" specified.` antes de extrair o texto. Isso bloqueia o fluxo de criacao de processo mesmo para PDFs validos, incluindo a SD TopDown que ja e lida fora do browser.

## What Changes

- Configurar o loader frontend do `pdfjs-dist` para funcionar no ambiente Vite/browser sem depender de configuracao global ausente.
- Garantir que a leitura de PDF no formulario de novo processo consiga iniciar e extrair texto de PDFs validos no browser.
- Manter suporte aos testes com loader injetado, sem acoplar testes unitarios a um worker real.
- Remover logging bruto de erro tecnico no console durante a conversao para erro amigavel.
- Adicionar cobertura que previna regressao do erro `GlobalWorkerOptions.workerSrc`.

## Capabilities

### New Capabilities

- `web-pdfjs-browser-loader`: Define o comportamento esperado para carregar e extrair PDFs no browser usando `pdfjs-dist` dentro do frontend web.

### Modified Capabilities

None.

## Impact

- Affected code: `apps/web/src/modules/processes/model/expense-request-pdf.ts`, testes do parser/importacao de PDF e possivelmente tipos de `pdfjs-dist`.
- APIs: nenhuma API nova ou alterada.
- Dependencies: nenhuma dependencia nova esperada; deve usar `pdfjs-dist` ja instalado e o bundling do Vite.
- UX: o dialog de importacao deixa de falhar por configuracao de worker ausente e continua mostrando erro amigavel apenas para arquivos invalidos ou nao legiveis.

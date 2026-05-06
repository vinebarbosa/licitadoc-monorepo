## Context

O fluxo de importacao da SD TopDown no frontend usa `pdfjs-dist/legacy/build/pdf.mjs` dentro de `apps/web/src/modules/processes/model/expense-request-pdf.ts`. Em ambiente Node/teste o loader injetado funciona, mas no navegador real o `getDocument` do `pdfjs` falha com `No "GlobalWorkerOptions.workerSrc" specified.` ao selecionar o PDF.

O app web roda com Vite. A solucao deve respeitar esse empacotamento e evitar depender de um asset copiado manualmente para `public/`, pois isso e facil de esquecer em build/deploy.

## Goals / Non-Goals

**Goals:**

- Configurar o worker do `pdfjs-dist` antes de chamar `getDocument` no browser.
- Preservar o caminho de testes com `PdfLoader` injetado.
- Garantir que selecionar um PDF valido no dialog de importacao nao falhe por falta de `workerSrc`.
- Manter mensagens amigaveis no dialog e remover logs tecnicos crus do fluxo de erro.
- Adicionar cobertura automatizada para a configuracao do worker.

**Non-Goals:**

- Trocar a biblioteca de leitura de PDF.
- Mover a extracao de volta para o backend.
- Alterar o parser TopDown ou o mapeamento de campos da SD.
- Persistir PDF ou criar upload temporario.

## Decisions

### Decision: Resolver o worker via import de asset do Vite

Usar a forma suportada pelo bundler, por exemplo importar `pdfjs-dist/legacy/build/pdf.worker.mjs?url` e atribuir esse URL a `GlobalWorkerOptions.workerSrc` antes de chamar `getDocument`. Isso deixa o worker versionado pelo pacote instalado e empacotado pelo Vite.

Alternativas consideradas:

- Desabilitar worker: poderia contornar o erro, mas reduz performance e pode bloquear a UI em PDFs maiores.
- Apontar para CDN: adiciona dependencia externa e risco offline/CSP.
- Copiar worker para `public/`: funciona, mas exige manutencao manual quando `pdfjs-dist` atualizar.

### Decision: Inicializacao idempotente no loader padrao

A configuracao deve ocorrer dentro ou imediatamente antes do `defaultPdfLoader`, de forma idempotente. Isso evita exigir setup global em componentes React e preserva o contrato simples de `extractTextFromExpenseRequestPdf(file)`.

Alternativas consideradas:

- Configurar no entrypoint da aplicacao: espalha conhecimento de PDF pelo app e dificulta testes isolados.
- Configurar no componente de formulario: acopla UI a detalhe da biblioteca.

### Decision: Testar sem worker real quando possivel

Os testes unitarios devem validar que o loader padrao configura `GlobalWorkerOptions.workerSrc` e chama `getDocument`, mas os testes de parser continuam usando loader injetado. A cobertura de browser/e2e deve garantir que abrir o dialog e selecionar um PDF nao produz o erro de worker ausente.

Alternativas consideradas:

- Testar somente em Playwright com PDF real: cobre o bug, mas torna diagnostico lento.
- Mockar tudo no teste de pagina: rapido, mas nao pega regressao na configuracao do `pdfjs`.

## Risks / Trade-offs

- [Risk] O caminho exato do worker pode variar entre builds do `pdfjs-dist`. -> Mitigacao: usar o entrypoint `pdf.worker.mjs?url` do pacote instalado e cobrir com typecheck/build/test.
- [Risk] Ambientes de teste podem nao entender `?url` diretamente. -> Mitigacao: ajustar declaracao de tipo ou isolar a configuracao em funcao testavel com mock do modulo.
- [Risk] Worker real pode nao iniciar por CSP futura. -> Mitigacao: manter erro amigavel e documentar que CSP precisa permitir worker local bundled.

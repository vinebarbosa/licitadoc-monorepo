## Why

O laboratório com Paged.js estabilizou a parte crítica do preview: folha A4 real, paginação automática, timbre oficial ocupando a página inteira e exportação PDF pelo navegador. Agora o preview oficial de documentos deve deixar de usar a superfície manual antiga e passar a usar essa mesma base paginada, para que revisão, impressão e PDF reflitam o documento final de forma previsível.

## What Changes

- Substituir a renderização principal de `/app/documento/:documentId/preview` pelo preview paginado com Paged.js.
- Reaproveitar o módulo já criado no laboratório (`DocumentPreview`, `PaperLayout`, `usePagedPreview` e estilos paged media) como base da página oficial.
- Renderizar documentos concluídos com `draftContentJson` preferencialmente, mantendo fallback seguro para documentos legados com apenas `draftContent`.
- Aplicar o timbre da organização como fundo A4 completo em todas as páginas quando `document.letterhead.url` existir.
- Manter loading, generating, failed, empty, retry, back navigation e ações do preview sem misturar UI do app no conteúdo impresso.
- Fazer `Imprimir` e `Exportar PDF` usarem a saída paginada oficial, com `window.print()` como caminho inicial de PDF.
- Remover ou isolar a paginação manual antiga do preview oficial para evitar conflito com Paged.js.
- Preservar a página demo/laboratório como rota de teste enquanto a substituição oficial é validada.

## Capabilities

### New Capabilities

- `official-paged-document-preview`: cobre a página oficial de preview de documentos usando Paged.js, incluindo conteúdo concluído, fallback legado, timbre A4 completo, impressão/PDF, estados existentes e isolamento de UI do app.

### Modified Capabilities

- None.

## Impact

- Web: `DocumentPreviewPageUI`, `DocumentSheet`, `DocumentTiptapPreview`, `DocumentMarkdownPreview`, módulo `paged-preview`, estilos de impressão e testes de preview.
- UX: o preview oficial passa a ter folhas A4 reais, timbre institucional completo, paginação automática e saída PDF mais fiel.
- Impressão/PDF: a página oficial deve imprimir apenas as páginas geradas pelo Paged.js, sem toolbar, app shell, cards, sombras ou conteúdo duplicado.
- Compatibilidade: documentos legados sem JSON continuam renderizando por fallback seguro.
- QA: exige testes de rota oficial, estados de preview, timbre, fallback Markdown, JSON concluído, exportação PDF e regressão contra duplicação de páginas/camadas.

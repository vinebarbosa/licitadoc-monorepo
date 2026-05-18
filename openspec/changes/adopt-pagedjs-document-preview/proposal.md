## Why

O preview/print atual ainda depende de CSS manual e paginação própria, o que deixa timbre, margens, quebras e páginas longas frágeis no navegador. O LicitaDoc precisa de um motor de paginação mais previsível para documentos oficiais extensos, com aparência de Word/Google Docs e saída confiável para impressão e PDF.

## What Changes

- Adotar `pagedjs` no web app para renderizar documentos HTML/React em páginas A4 reais no preview.
- Criar um fluxo de renderização `Editor/TipTap -> HTML React -> Paged.js -> preview paginado -> print/PDF`.
- Adicionar componentes reutilizáveis para preview paginado, layout de papel, cabeçalho, rodapé, watermark e ações de impressão/exportação.
- Renderizar o conteúdo em um container oculto de origem e gerar páginas paginadas em um container visível usando `Previewer`.
- Reprocessar o preview quando o conteúdo, cabeçalho, rodapé, timbre ou opções de layout mudarem.
- Suportar cabeçalho e rodapé institucionais repetidos automaticamente, numeração de páginas, watermark opcional, tabelas longas, listas, imagens e conteúdo rico vindo do TipTap.
- Usar `window.print()` como primeira implementação de "Exportar PDF", preservando uma superfície limpa para evolução futura.
- Substituir gradualmente a lógica manual de paginação/print do preview concluído por um contrato de paginação baseado em Paged.js, sem quebrar estados existentes do preview.

## Capabilities

### New Capabilities

- `paged-document-preview`: cobre o preview profissional paginado com Paged.js, incluindo páginas A4, cabeçalho/rodapé repetidos, numeração, watermark, impressão/PDF e conteúdo rico.

### Modified Capabilities

- None.

## Impact

- Web: instalação de `pagedjs`, novos componentes de preview/layout, hook reutilizável de paginação, estilos específicos de print/screen e integração com o preview de documentos concluídos.
- TipTap: o conteúdo salvo em JSON/HTML deve ser renderizado em uma origem HTML compatível com Paged.js antes da paginação.
- UX: o preview passa a exibir folhas A4 paginadas, com sombra e espaçamento entre páginas na tela, e impressão limpa sem chrome do app.
- Performance: documentos longos exigem cleanup de instâncias, debounce/reprocessamento controlado e prevenção de duplicação de páginas.
- QA: precisa de testes de hook/componentes, regressão de preview, impressão via browser e exemplos com múltiplas páginas, tabelas e assinaturas.

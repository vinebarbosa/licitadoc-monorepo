## Why

Ao imprimir um preview de documento paginado, o PDF pode sair com grandes áreas em branco entre as folhas porque os espaçadores visuais usados para simular a paginação na tela vazam para o fluxo de impressão.

Isso precisa ser corrigido agora porque o preview já é usado como documento formal para conferência e exportação, e a impressão com páginas quase vazias aumenta o número de folhas e reduz a confiança no resultado gerado.

## What Changes

- Ajustar a impressão do preview TipTap paginado para que os espaçadores de tela não sejam impressos como altura real dentro das páginas.
- Garantir que quebras automáticas e manuais continuem iniciando uma nova página impressa quando suportado pelo navegador.
- Tornar o CSS dinâmico de paginação compatível com `@media print`, evitando que regras injetadas por página preservem `margin-top`/altura artificial durante a impressão.
- Preservar a aparência paginada na tela, incluindo molduras, sombras, gaps e deslocamento de conteúdo entre folhas.
- Preservar o conteúdo TipTap salvo como fonte canônica, sem persistir nós de quebra automática ou marcadores específicos de impressão.
- Adicionar cobertura de testes para regressões no print stylesheet e para o CSS de paginação injetado.

## Capabilities

### New Capabilities

- `document-preview-print-pagination`: Define o comportamento de impressão/exportação do preview de documentos com paginação automática e manual.

### Modified Capabilities

None.

## Impact

- Frontend:
  - `apps/web/src/modules/documents/ui/document-pagination-surface.tsx`
  - `apps/web/src/modules/documents/ui/document-tiptap-preview.tsx`
  - `apps/web/src/modules/documents/ui/document-preview-page.tsx`
  - `apps/web/src/styles.css`
- Tests:
  - `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
  - `apps/web/src/modules/documents/model/document-pagination.test.ts`
- No API, database, dependency, or generated document recipe changes are required.

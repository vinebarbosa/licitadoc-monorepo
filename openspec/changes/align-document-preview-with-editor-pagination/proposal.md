## Why

O preview do documento não está refletindo fielmente o que o usuário edita e salva no editor validado, porque a edição já trabalha com TipTap JSON enquanto o preview concluído ainda depende de uma representação textual/Markdown. Isso quebra a confiança no fluxo: o usuário edita, salva e espera ver a mesma composição visual, inclusive espaçamento, listas, indentação e quebras de página.

## What Changes

- Fazer o preview de documento concluído renderizar a versão TipTap JSON salva quando ela existir, usando a mesma linguagem visual validada no editor.
- Manter `draftContentJson` como fonte canônica para conteúdo editado e evitar que o preview perca estrutura ao passar por Markdown/texto de compatibilidade.
- Adicionar suporte consistente a quebras de página no editor e no preview, sem rótulo explícito, com o mesmo espaço visual entre folhas.
- Compartilhar o contrato de folha, tipografia, margens, indentação, listas, alinhamento e espaçamento entre editor e preview para que os dois pareçam o mesmo documento em modos diferentes.
- Preservar os estados existentes do preview, incluindo geração em tempo real, erro, vazio, impressão e ações de exportação.

## Capabilities

### New Capabilities
- `document-preview-editor-parity`: cobre a paridade visual e estrutural entre o editor TipTap salvo e o preview read-only, incluindo renderização de JSON e quebras de página.

### Modified Capabilities
- `document-generation`: ajusta o contrato de leitura de documentos para que o detalhe concluído exponha conteúdo TipTap JSON suficiente para preview e edição, mantendo a compatibilidade textual apenas como fallback/exportação.

## Impact

- Web: preview de documento, editor validado, componentes compartilhados de superfície/documento, estilos globais de folha, testes de página e testes de renderização.
- API/client: contrato de detalhe de documento e cache de documento para garantir `draftContentJson` no preview.
- Dados: nenhuma migração destrutiva prevista; documentos legados sem JSON continuam com fallback derivado, enquanto documentos editados usam JSON como fonte principal.
- UX: preview e editor passam a exibir a mesma estrutura de conteúdo, com quebras de página visíveis nos dois modos.

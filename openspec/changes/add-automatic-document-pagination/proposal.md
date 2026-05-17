## Why

O editor e o preview de documentos já compartilham TipTap JSON, mas a "quebra de página" atual depende de marcadores manuais e não reage ao conteúdo exceder a altura da folha. Isso faz documentos longos parecerem uma única folha esticada, quebrando a expectativa de edição e validação visual em formato de documento formal.

## What Changes

- Adicionar paginação automática no editor e no preview quando o conteúdo ultrapassar a altura útil de uma folha.
- Medir o layout renderizado do documento para distribuir blocos TipTap em páginas visuais, respeitando largura, margens, tipografia, indentação, listas e zoom.
- Mostrar páginas como folhas independentes, com fundo do workspace entre elas e sombra própria por folha.
- Manter quebras manuais existentes como orientação de paginação, sem depender delas para documentos longos.
- Preservar o TipTap JSON salvo como fonte canônica do conteúdo; a paginação visual deve ser derivada da renderização, não persistida como cópia fragmentada do documento.
- Manter seleção de texto, comandos de edição, IA, salvamento, preview read-only e impressão funcionando no conteúdo paginado.

## Capabilities

### New Capabilities

- `document-automatic-pagination`: cobre paginação automática por medição de layout no editor e no preview de documentos TipTap, incluindo folhas visuais, recálculo responsivo, compatibilidade com quebras manuais e comportamento de impressão.

### Modified Capabilities

- None.

## Impact

- Web: experiência validada `/demo/documento/editor`, editor protegido de documento, preview concluído em JSON, estilos globais de folha, medição de layout, seleção de texto, IA e testes visuais.
- Dados/API: sem migração destrutiva prevista; o conteúdo continua salvo como TipTap JSON único.
- Performance: exige estratégia de medição com debounce/observadores para evitar repaginação excessiva em documentos longos.
- QA: precisa de testes unitários para particionamento e testes de browser para documentos longos, edição, zoom, preview e impressão.

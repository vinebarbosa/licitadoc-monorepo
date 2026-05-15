## Why

O preview do documento gerado já oferece um caminho inicial para pedir ajuste em um trecho selecionado, mas a experiência ainda não deixa claro que aquele trecho está sendo reprocessado e o usuário precisa confiar que a alteração será persistida corretamente. Esta mudança fecha o fluxo de ponta a ponta: seleção visível em estado de ajuste, sugestão controlada e aplicação real no conteúdo salvo.

## What Changes

- Adicionar um estado visual de ajuste no preview: quando o usuário pedir ajuste para um trecho selecionado, a área correspondente no documento deve aparecer como um skeleton cinza até a sugestão/aplicação terminar ou falhar.
- Garantir que a sugestão de ajuste seja gerada para o trecho resolvido no Markdown fonte, mantendo proteção contra seleção ambígua, documento desatualizado e conflito de conteúdo.
- Garantir que ao aplicar a sugestão, o trecho selecionado seja substituído no `draftContent` persistido e o preview passe a renderizar o conteúdo atualizado.
- Melhorar o feedback de erro/sucesso para o usuário quando a seleção não puder ser resolvida, quando a sugestão falhar, ou quando o documento mudar antes da aplicação.
- Cobrir o fluxo com testes focados no backend de resolução/aplicação e no frontend de seleção, skeleton e atualização do preview.

## Capabilities

### New Capabilities

- `document-text-adjustment`: Fluxo de ajuste de trecho selecionado em documentos gerados, incluindo resolução do alvo, sugestão por IA, skeleton visual no preview e persistência do ajuste aplicado.

### Modified Capabilities

- None.

## Impact

- Affected frontend code: document preview UI, Markdown selection handling, text adjustment panel, document API hooks and tests.
- Affected backend code: document text adjustment service/routes/schemas as needed to make target resolution and application reliable.
- APIs: existing document adjustment endpoints may be tightened but no new dependency is expected.
- Database: no schema migration expected; adjustments update the existing `documents.draftContent`.

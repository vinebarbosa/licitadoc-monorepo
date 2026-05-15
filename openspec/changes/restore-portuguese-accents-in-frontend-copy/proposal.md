## Why

O frontend hoje exibe várias mensagens, títulos, labels e estados em português sem acentuação correta, o que passa sensação de acabamento incompleto e reduz a qualidade percebida do produto. Esse ajuste é necessário agora porque o problema já aparece em fluxos centrais e demos públicas, inclusive em páginas recém-validadas.

## What Changes

- Revisar a cópia visível ao usuário no frontend web para corrigir palavras em português sem acentos indevidamente removidos.
- Padronizar textos de interface em PT-BR nas rotas autenticadas, páginas públicas de demo, estados vazios, mensagens de erro e feedbacks de ação.
- Definir um critério explícito para diferenciar texto de interface que deve ser corrigido de identificadores técnicos, chaves, exemplos internos e strings que não compõem a experiência final.
- Atualizar testes do frontend que hoje validam as versões sem acento dessas mensagens.

## Capabilities

### New Capabilities
- `web-pt-br-copy`: garante que a interface web exibida ao usuário utilize textos em português do Brasil com acentuação correta e consistente.

### Modified Capabilities
- `web-design-system-foundation`: reforçar que a qualidade textual da interface inclui consistência ortográfica e acentuação correta em PT-BR.

## Impact

- Código afetado: `apps/web/src/**`, com maior concentração em onboarding, processos, documentos, usuários, páginas públicas e fallbacks de rota.
- Testes afetados: suites do frontend que assertam headings, toasts, labels e mensagens visíveis.
- APIs e contratos backend: sem mudança funcional esperada.
- Demos públicas: devem refletir a mesma qualidade textual do app autenticado.

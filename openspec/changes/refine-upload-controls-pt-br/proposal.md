## Why

Os uploads de SD e papel timbrado ainda exibem o controle nativo do navegador com texto em inglês, como "Choose File", o que quebra a percepção de produto maduro em fluxos centrais. A melhoria é necessária agora porque esses pontos aparecem em momentos sensíveis de configuração e criação de processo, onde o usuário espera uma experiência institucional, clara e em PT-BR.

## What Changes

- Substituir os inputs de arquivo visíveis por um padrão de upload próprio do Licitadoc, com botão, ícone, nome do arquivo, estado vazio, estado selecionado, remoção e mensagens em português.
- Manter o `input type="file"` apenas como implementação acessível e invisível, acionado por controles estilizados e rotulados em PT-BR.
- Refinar o modal "Importar SD" para apresentar a seleção do PDF como uma área de ação compacta, madura e coerente com o restante do formulário.
- Refinar o upload de papel timbrado no onboarding para evitar a caixa nativa paralela ao cartão visual e deixar o conteúdo melhor alinhado.
- Preservar validações, limites de tipo/tamanho, estados de leitura, erros e testes dos fluxos existentes.
- Documentar o contexto visual para o v0: software B2B/governo maduro, denso sem parecer pesado, sem linguagem de landing page, usando a paleta institucional atual.

## Capabilities

### New Capabilities
- `web-upload-control-experience`: cobre o comportamento, a cópia em PT-BR, a acessibilidade e os estados visuais dos controles de upload no frontend.

### Modified Capabilities
- `web-design-system-foundation`: reforça que o design system deve oferecer ou orientar um padrão compartilhável para uploads estilizados, sem expor controles nativos com texto do navegador na interface final.

## Impact

- Código afetado: `apps/web/src/modules/processes/ui/sd-import-dialog.tsx`, `apps/web/src/modules/onboarding/ui/onboarding-views.tsx` e, se fizer sentido, um novo primitivo em `apps/web/src/shared/ui`.
- Testes afetados: testes de criação de processo e onboarding que selecionam arquivos por label.
- APIs afetadas: nenhuma mudança esperada.
- Dependências: nenhuma nova dependência esperada; usar ícones já disponíveis via `lucide-react` e tokens de estilo existentes.

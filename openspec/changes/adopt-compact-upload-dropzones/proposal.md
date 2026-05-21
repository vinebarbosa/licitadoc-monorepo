## Why

O upload recém-polido removeu o texto nativo do navegador, mas a superfície ainda funciona visualmente como uma linha de seleção. Um dropzone compacto comunica melhor a ação de anexar arquivos, melhora a percepção de acabamento e permite arrastar-e-soltar sem transformar os fluxos em áreas grandes ou promocionais.

## What Changes

- Evoluir o padrão `FileUploadField` para oferecer uma variação de dropzone compacta, com ação por clique e arrastar-e-soltar.
- Aplicar dropzone compacto no modal "Importar SD", preservando um dialog enxuto e sem área exagerada.
- Aplicar dropzone mais generoso, porém ainda contido, na seção "Papel timbrado" do onboarding.
- Exibir estados em PT-BR para vazio, arrastando arquivo, arquivo selecionado, erro, leitura/desabilitado e remoção.
- Preservar o `input type="file"` oculto e acessível, labels atuais, validações, tipos aceitos, tamanhos máximos e testes existentes.
- Manter a paleta institucional atual: neutros frios, bordas sutis, foco em `ring`, realces em `primary`, erro em `destructive` e sucesso apenas quando houver semântica real.

## Capabilities

### New Capabilities
<!-- None. This change refines an existing upload-control capability. -->

### Modified Capabilities
- `web-upload-control-experience`: adiciona suporte normativo a dropzones compactos, drag-and-drop e estados visuais de arraste para uploads do frontend.
- `web-design-system-foundation`: reforça que o padrão compartilhado de upload deve cobrir dropzone compacto sem quebrar acessibilidade ou densidade operacional.

## Impact

- Código afetado: `apps/web/src/shared/ui/file-upload-field.tsx`, `apps/web/src/modules/processes/ui/sd-import-dialog.tsx`, `apps/web/src/modules/onboarding/ui/onboarding-views.tsx`.
- Testes afetados: testes de criação de processo e onboarding; possivelmente nova cobertura unitária/smoke do componente compartilhado para drag-and-drop.
- APIs afetadas: nenhuma mudança esperada.
- Dependências: nenhuma nova dependência esperada.

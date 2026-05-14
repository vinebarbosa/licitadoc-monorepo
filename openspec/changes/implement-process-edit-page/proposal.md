## Why

O produto já expõe a criação e o detalhe de processos, mas ainda não permite editar os dados de um processo existente pela interface web. Isso deixa a ação `Editar` do detalhe sem fluxo concluído e obriga qualquer ajuste de processo a ficar fora da experiência principal do app.

## What Changes

- Adicionar uma página protegida de edição de processo em `/app/processo/:processId/editar`.
- Reaproveitar o formulário autenticado de criação como base visual e funcional do fluxo de edição, mantendo a estrutura em etapas, validações e resumo.
- Carregar os dados atuais do processo pela API para preencher o formulário de edição, incluindo departamentos e itens já persistidos.
- Persistir as alterações usando o endpoint existente de atualização de processo na API.
- Integrar a navegação do detalhe do processo para que a ação `Editar` leve a uma rota funcional no app shell.
- Incluir estados de carregamento, erro de leitura e erro de atualização sem quebrar a experiência do wizard.

## Capabilities

### New Capabilities
- `web-process-edit-flow`: A web app fornece uma página protegida de edição de processo baseada no formulário de criação, preenchida por dados reais do processo e conectada ao update da API.

### Modified Capabilities

## Impact

- Frontend de processos: página de criação, nova página de edição, camada `api`, model helpers, router e testes.
- Fluxo de detalhe de processo: a ação `Editar` passa a apontar para uma rota implementada.
- Contratos de API já existentes: reuso de `GET /api/processes/:processId` para prefill e `PATCH /api/processes/:processId` para persistência.

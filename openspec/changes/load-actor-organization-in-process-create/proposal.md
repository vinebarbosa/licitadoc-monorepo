## Why

O formulário autenticado de criação de processo já depende dos dados institucionais da organização do ator, mas hoje usuários não-admin não carregam essa organização pela API. Em vez disso, a tela usa apenas o `organizationId` da sessão e um placeholder local, o que deixa o fluxo inconsistente com os dados reais persistidos.

## What Changes

- Adicionar um endpoint autenticado para retornar a organização vinculada ao ator atual quando ele possuir `organizationId`.
- Permitir que atores com escopo organizacional leiam sua própria organização por esse novo contrato sem precisar listar organizações nem conhecer o id pela URL.
- Trocar, no formulário autenticado de criação de processo, o fallback local de "Sua organização" por uma consulta à API para a organização do ator.
- Manter o fluxo de admin usando a listagem paginada de organizações para seleção manual no formulário.
- Preservar a validação atual de departamentos e o envio do payload canônico de criação de processo.

## Capabilities

### New Capabilities
- `web-process-create-flow`: A página autenticada de criação de processo carrega a organização do ator pela API quando o usuário não é admin e usa esse perfil real nos campos e no resumo.

### Modified Capabilities
- `organization-management`: O contrato de organizações passa a expor uma leitura da organização atual do ator autenticado, sem exigir `organizationId` na rota.

## Impact

- API de organizações: rotas, schemas OpenAPI, políticas de autorização, handler de leitura e testes.
- Cliente gerado da API e hooks do frontend para consulta da organização atual.
- Página [process-create-page.tsx](/Users/vine/Documents/licitadoc/apps/web/src/modules/processes/pages/process-create-page.tsx) e seus testes.

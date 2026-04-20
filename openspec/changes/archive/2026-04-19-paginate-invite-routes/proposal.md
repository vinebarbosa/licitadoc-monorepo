## Why

As rotas de listagem de convites ainda retornam todos os registros visíveis de uma vez. Isso dificulta escalar o módulo administrativo, aumenta o custo de resposta e deixa sem contrato o consumo incremental da lista de invites no frontend ou no cliente gerado.

## What Changes

- Paginar a rota de listagem de convites da API usando parâmetros explícitos de consulta.
- Padronizar a resposta paginada de convites com metadados suficientes para navegação entre páginas.
- Reaproveitar o helper de paginação já existente no backend para manter consistência com o restante da API.
- Atualizar OpenAPI e cliente gerado para refletir o novo contrato da listagem de convites.

## Capabilities

### New Capabilities
- `invite-list-pagination`: Define como rotas de coleção de convites expõem paginação baseada em página e tamanho de página.

### Modified Capabilities

## Impact

- Afeta `apps/api`, especialmente o módulo `invites`, os schemas Zod das rotas e a consulta ao banco da listagem.
- Impacta o documento OpenAPI e `packages/api-client`, que passarão a expor query params e resposta paginada para a listagem de convites.
- Pode impactar consumidores de `/api/invites`, já que a forma do payload deixa de ser apenas `{ items }`.

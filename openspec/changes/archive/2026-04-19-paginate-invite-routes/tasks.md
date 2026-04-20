## 1. Ajustar o contrato da listagem de convites

- [x] 1.1 Adicionar `page` e `pageSize` aos query params de `GET /api/invites` e definir o schema da resposta paginada com `items`, `page`, `pageSize`, `total` e `totalPages`
- [x] 1.2 Atualizar a rota e o serviço de listagem de convites para reutilizar `normalizePagination()` e manter o escopo atual de `admin` e `organization_owner`

## 2. Implementar paginação no acesso a dados

- [x] 2.1 Aplicar `limit` e `offset` na consulta de convites com ordenação estável por data de criação
- [x] 2.2 Calcular `total` e `totalPages` com o mesmo filtro de visibilidade usado na página atual

## 3. Validar o contrato atualizado

- [x] 3.1 Cobrir com testes a paginação da listagem de convites, incluindo defaults e escopo por organização
- [x] 3.2 Regenerar OpenAPI e `packages/api-client`, ajustando incompatibilidades do novo payload se surgirem
- [x] 3.3 Executar as verificações relevantes dos pacotes afetados, incluindo lint e typecheck

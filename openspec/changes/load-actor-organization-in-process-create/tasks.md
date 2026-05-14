## 1. Organizations API

- [x] 1.1 Adicionar o contrato OpenAPI, a rota e o handler de `GET /api/organizations/me` reutilizando o schema de organização existente.
- [x] 1.2 Implementar a autorização e a resolução da organização atual do ator para `organization_owner` e `member` com `organizationId` preenchido.
- [x] 1.3 Cobrir a nova rota com testes de unidade/serviço para sucesso, ator sem organização e bloqueio de acesso arbitrário.
- [x] 1.4 Regenerar o `@licitadoc/api-client` após a inclusão do novo endpoint.

## 2. Web Process Create Flow

- [x] 2.1 Adicionar um hook/query no frontend para consumir `GET /api/organizations/me`.
- [x] 2.2 Atualizar a página autenticada de criação de processo para usar a organização atual da API em sessões não-admin e remover o fallback local de "Sua organização".
- [x] 2.3 Preservar o fluxo de admin com a listagem de organizações e manter o escopo de departamentos baseado na organização efetivamente carregada.

## 3. Verification

- [x] 3.1 Atualizar os testes da página de criação de processo para cobrir o carregamento da organização atual e o estado de erro da referência.
- [x] 3.2 Executar os testes focados de organizações na API e do process create page no web.

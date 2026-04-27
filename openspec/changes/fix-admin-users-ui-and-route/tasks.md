## 1. Routing and navigation

- [x] 1.1 Expor `/admin/usuarios` como rota canônica protegida para admins e redirecionar `/app/admin/usuarios` para o novo caminho
- [x] 1.2 Atualizar a navegação administrativa e demais referências de rota para usar `/admin/usuarios`

## 2. Admin users page parity

- [x] 2.1 Reorganizar `AdminUsersPage` para recuperar a hierarquia visual da tela legada de `/tmp/usuarios.tsx` com os papéis e dados reais do produto
- [x] 2.2 Ajustar tabela, identidade visual das linhas, filtros, estados de loading/empty e paginação para refletirem a estrutura operacional da tela antiga sem perder o estado via URL
- [x] 2.3 Manter os fluxos de convite, gerenciamento e exclusão funcionando dentro da nova composição visual e com cópia alinhada ao domínio atual

## 3. Validation

- [x] 3.1 Atualizar testes de rota para cobrir acesso em `/admin/usuarios`, proteção por papel e redirecionamento do caminho legado
- [x] 3.2 Atualizar testes da página para cobrir a rota canônica, restauração de filtros pela URL e os principais estados da interface refeita
- [x] 3.3 Executar validações focadas do web slice tocado, incluindo testes relevantes e checagens estáticas aplicáveis
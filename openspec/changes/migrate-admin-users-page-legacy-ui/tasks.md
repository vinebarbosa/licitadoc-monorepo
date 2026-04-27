## 1. Module structure and migration setup

- [x] 1.1 Organizar `apps/web/src/modules/users` em `pages`, `ui`, `model` e `api` conforme necessário para a tela administrativa, mantendo `AdminUsersPage` como entrypoint fino
- [x] 1.2 Criar mapeadores e helpers locais para adaptar papéis, labels, estatísticas e affordances da referência legada ao domínio atual (`admin`, `organization_owner`, `member`)

## 2. Admin users page migration

- [x] 2.1 Migrar a composição visual de `/tmp/usuarios.tsx` para a página real em `apps/web/src/modules/users`, preservando header, cards, filtros, tabela, estados de loading/empty e paginação
- [x] 2.2 Conectar a tela migrada aos dados reais de usuários e organizações, mantendo filtros e paginação orientados por URL em vez de mocks locais
- [x] 2.3 Ligar o CTA principal e as ações por linha aos fluxos atuais de convite, inspeção/edição e remoção sem reintroduzir criação direta de usuário

## 3. Validation

- [x] 3.1 Atualizar ou adicionar testes do módulo/página para cobrir renderização do layout migrado, restauração de filtros pela URL e estados principais da interface
- [x] 3.2 Executar validações focadas do slice web tocado, incluindo checagens estáticas e testes relevantes para a experiência administrativa de usuários
## Why

A experiência administrativa de usuários já tem rota canônica, proteção por papel e integrações reais previstas no app, mas a página atual ainda não entrega a interface operacional esperada a partir de `/tmp/usuarios.tsx`. Isso mantém o admin sem a tela legada migrada para a arquitetura nova e deixa o módulo de usuários sem a composição visual e estrutural que o produto já validou.

## What Changes

- Migrar a interface de `/tmp/usuarios.tsx` para `apps/web` preservando a hierarquia visual, os estilos e os estados operacionais esperados na tela administrativa de usuários.
- Reorganizar a implementação em `apps/web/src/modules/users` seguindo a arquitetura do projeto, separando página, componentes do módulo, adaptadores de dados e helpers locais nas pastas corretas.
- Substituir comportamentos mockados da referência legada por integrações reais com listagem de usuários, organizações, convites e ações administrativas já existentes.
- Manter o contrato funcional atual do produto, incluindo a rota administrativa existente, o fluxo de convite para provisionar `organization_owner` e as ações reais de edição e remoção.
- Adicionar cobertura focada para garantir que a tela migrada preserve estados de carregamento, vazio, filtros, paginação e ações por linha.

## Capabilities

### New Capabilities
- `web-admin-users-ui-parity`: Define a experiência visual e operacional da página administrativa de usuários com paridade em relação a `/tmp/usuarios.tsx`, preservando a rota atual e o uso de dados reais.

### Modified Capabilities
Nenhuma.

## Impact

- Affected code: `apps/web/src/modules/users/**`, `apps/web/src/app/router.tsx` (somente se necessário para compor breadcrumbs/entrypoint existente), componentes compartilhados eventualmente reutilizados e testes do frontend ligados ao fluxo administrativo de usuários.
- APIs: nenhum endpoint novo; a tela continua dependente dos contratos atuais de usuários, organizações e convites.
- Systems: navegação administrativa autenticada, composição do módulo de usuários no web app e cobertura de testes da experiência administrativa.
## Context

O módulo de organizações já expõe listagem paginada (`GET /api/organizations/`) e detalhe por id (`GET /api/organizations/:organizationId`), mas o create page autenticado não consegue usar esse contrato para usuários não-admin. A tela recebe apenas `organizationId` pela sessão e, como não carrega a organização pela API nesse caso, preenche o fluxo com um placeholder local de "Sua organização".

O problema mistura backend e frontend:
- o backend não oferece uma leitura simples da organização do ator atual;
- o frontend evita a listagem para não-admin e acaba sem um perfil institucional real para exibir.

## Goals / Non-Goals

**Goals:**
- Expor uma rota autenticada para retornar a organização vinculada ao ator atual.
- Permitir esse acesso para atores com escopo organizacional sem abrir leitura arbitrária por id para `member`.
- Fazer a página autenticada de criação de processo usar o perfil real da organização do ator quando o usuário não é admin.
- Preservar o fluxo de admin baseado em listagem e seleção de organização.

**Non-Goals:**
- Alterar o contrato de listagem de organizações.
- Mudar regras de criação de processo, departamentos ou sessão.
- Remodelar a UI do wizard além da troca da origem dos dados da organização.

## Decisions

1. Adicionar `GET /api/organizations/me` no módulo de organizações.

   Rationale: a rota resolve exatamente o dado que o frontend precisa, sem exigir que a tela componha um detalhe por id a partir da sessão e sem depender da permissão de listagem.

   Alternative considered: reutilizar `GET /api/organizations/:organizationId` no frontend com o `organizationId` da sessão. Isso exigiria ampliar a política de leitura por id para `member` ou aceitar que a tela conheça detalhes de autorização do backend.

2. Limitar `GET /api/organizations/me` a atores autenticados com `organizationId` preenchido.

   Rationale: o endpoint representa "a organização atual do ator", então ele só existe para usuários vinculados a uma organização. `organization_owner` e `member` devem conseguir acessar esse recurso; admins continuam usando a listagem existente.

   Alternative considered: permitir que `admin` também use a rota. Isso não resolve um caso real do formulário e enfraquece o significado de "me" quando o admin não possui organização própria.

3. Reutilizar o mesmo schema de organização já exposto pelos endpoints de detalhe/listagem.

   Rationale: o frontend precisa do mesmo perfil institucional já padronizado no módulo. Reusar o schema evita drift entre contratos, simplifica a geração do client e mantém o resumo do processo coerente com outros pontos do produto.

   Alternative considered: retornar uma versão resumida da organização. Isso diminuiria o payload, mas criaria um segundo contrato para o mesmo conceito sem necessidade imediata.

4. No frontend, consultar `/api/organizations/me` apenas para usuários não-admin e remover o fallback local de organização.

   Rationale: o admin já precisa escolher entre várias organizações e continua dependendo da listagem. Para atores com escopo organizacional, a organização vem da nova rota e continua sendo aplicada automaticamente ao formulário e ao resumo.

   Alternative considered: habilitar a listagem de organizações para todos. Isso não atende `member` com a política atual e buscaria mais dados do que a tela precisa.

## Risks / Trade-offs

- [A nova rota pode divergir da política de detalhe por id] → Implementar autorização dedicada para "própria organização" e cobrir `organization_owner`, `member`, ator sem organização e admin em testes.
- [O frontend pode continuar mostrando placeholders em estados de loading/erro] → Atualizar a página para depender do resultado da query da organização atual e validar a renderização com testes do wizard.
- [O client gerado pode ficar desatualizado em relação ao novo endpoint] → Regenerar o `@licitadoc/api-client` logo após a alteração dos schemas OpenAPI.

## Migration Plan

1. Adicionar schema, rota, policy e handler de `GET /api/organizations/me`.
2. Regenerar o client da API para expor o novo endpoint ao frontend.
3. Atualizar a página de criação de processo para usar a query da organização atual em sessões não-admin.
4. Atualizar testes de API e web para cobrir o novo carregamento.

Sem migração de banco. Rollback consiste em remover a rota e restaurar o fallback local do frontend caso a integração precise ser revertida.

## Open Questions

Nenhuma aberta no momento. O comportamento desejado está suficientemente claro: usuários com organização precisam receber o perfil real da própria organização para o fluxo de criação de processo.

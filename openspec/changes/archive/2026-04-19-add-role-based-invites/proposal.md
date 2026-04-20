## Why

O módulo administrativo ainda não oferece uma forma controlada de convidar novos usuários para a plataforma. Isso bloqueia o onboarding por papel e deixa sem definição o fluxo para criar `organization_owner` e `member` já vinculados à organização correta.

## What Changes

- Adicionar um módulo de convites para criar, consultar e aceitar invites de usuários.
- Persistir convites com e-mail de destino, papel pretendido, organização associada quando aplicável, usuário que convidou, status e metadados de expiração.
- Aplicar regras de criação baseadas no papel do convidador: `admin` cria convites para `organization_owner`; `organization_owner` cria convites para `member`.
- Garantir que convites com organização definida provisionem o usuário já vinculado à organização ao serem aceitos.
- Preparar a API para o fluxo administrativo de convites, incluindo validações de autorização e consistência entre `role` e `organizationId`.

## Capabilities

### New Capabilities
- `user-invites`: Define o ciclo de vida de convites de usuários com papel de destino e associação opcional a uma organização.

### Modified Capabilities

## Impact

- Afeta `apps/api`, principalmente autenticação, autorização, módulo de usuários, módulo de organizações e bootstrap de rotas.
- Exige nova modelagem de banco e migrações para armazenar convites e seus metadados.
- Impacta o fluxo administrativo de cadastro, porque a criação de usuários passa a poder acontecer a partir da aceitação de um convite válido.

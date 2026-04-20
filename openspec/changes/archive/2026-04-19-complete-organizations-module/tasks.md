## 1. Expandir o modelo e o contrato do módulo organizations

- [x] 1.1 Expandir o schema da tabela `organizations` com os campos institucionais da prefeitura e gerar a migration correspondente
- [x] 1.2 Substituir `getOrganization` por consulta real à tabela `organizations`, com serialização completa do perfil institucional
- [x] 1.3 Adicionar listagem paginada em `GET /api/organizations` com `page`, `pageSize`, `items`, `total` e `totalPages`
- [x] 1.4 Expandir os schemas Zod e o contrato HTTP do módulo `organizations` para refletir o novo modelo de dados

## 2. Implementar onboarding e gestão administrativa

- [x] 2.1 Definir e aplicar policies de create/list/read/update para distinguir onboarding de `organization_owner` sem organização, `admin`, `organization_owner` com organização e `member`
- [x] 2.2 Implementar `POST /api/organizations` como fluxo transacional de onboarding que cria a organização e vincula o `organization_owner` autenticado à própria prefeitura
- [x] 2.3 Implementar `PATCH /api/organizations/:organizationId` com persistência real dos campos permitidos, restrição de campos administrativos e tratamento de conflito para `slug` e `cnpj`
- [x] 2.4 Registrar as rotas finais do módulo e deixar explícito que exclusão de organizações continua fora desta change

## 3. Validar o módulo finalizado

- [x] 3.1 Cobrir com testes os cenários de onboarding, listagem, detalhe e update com escopo por papel e conflito de unicidade
- [x] 3.2 Regenerar OpenAPI e `packages/api-client`, ajustando incompatibilidades de contrato se surgirem
- [x] 3.3 Executar as verificações relevantes dos pacotes afetados, incluindo testes, lint e typecheck

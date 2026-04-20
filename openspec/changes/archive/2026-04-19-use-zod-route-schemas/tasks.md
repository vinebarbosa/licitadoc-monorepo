## 1. Preparar a integração Zod/Fastify/OpenAPI

- [x] 1.1 Escolher e adicionar a integração compatível entre Zod, Fastify e `@fastify/swagger` para validação runtime e exportação OpenAPI
- [x] 1.2 Configurar o bootstrap da API para aceitar schemas Zod nas rotas e manter a geração de `/openapi.json`
- [x] 1.3 Validar a integração escolhida em uma rota representativa antes de migrar todos os módulos

## 2. Migrar os schemas próprios da API para Zod

- [x] 2.1 Converter os schemas compartilhados e de `health` para o padrão Zod
- [x] 2.2 Converter `organizations.schemas.ts` e `users.schemas.ts` para Zod sem alterar o comportamento das rotas
- [x] 2.3 Converter `processes.schemas.ts` e `documents.schemas.ts` para Zod sem alterar o comportamento das rotas
- [x] 2.4 Ajustar os pontos de uso nas rotas para consumir os novos schemas Zod como fonte única do contrato HTTP

## 3. Preservar o contrato OpenAPI e o cliente gerado

- [x] 3.1 Exportar ou servir o `openapi.json` com os schemas derivados de Zod e verificar que as rotas da aplicação continuam documentadas
- [x] 3.2 Regenerar `packages/api-client` a partir do `openapi.json` atualizado e corrigir incompatibilidades de contrato se surgirem

## 4. Verificar a mudança de ponta a ponta

- [x] 4.1 Executar as verificações relevantes da API e do workspace, incluindo typecheck e lint dos pacotes afetados
- [x] 4.2 Validar pelo menos um cenário de rota inválida e um cenário de geração de cliente para confirmar os requisitos da spec

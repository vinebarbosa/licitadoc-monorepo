## Why

Hoje a API define os schemas das rotas com objetos JSON Schema escritos manualmente, enquanto `zod` já é usado no projeto apenas para validar ambiente. Isso cria dois problemas: a validação HTTP não compartilha a mesma fonte de verdade com os tipos TypeScript e qualquer evolução do contrato tende a ficar mais custosa e sujeita a divergências.

## What Changes

- Adotar `zod` como fonte de definição dos schemas HTTP das rotas da API.
- Introduzir uma estratégia única para usar schemas Zod em `params`, `querystring`, `body` e `response`.
- Garantir que a validação runtime das rotas continue funcionando após a migração.
- Garantir que a geração de OpenAPI continue produzindo um contrato compatível com o `packages/api-client`.
- Migrar os módulos atuais da API de schemas JSON Schema manuais para schemas baseados em Zod.

## Capabilities

### New Capabilities
- `api-route-schemas`: Define como a API descreve e valida contratos HTTP de rotas a partir de schemas Zod, preservando validação runtime e geração de OpenAPI.

### Modified Capabilities

## Impact

- Afeta `apps/api`, especialmente os arquivos `*.schemas.ts`, o registro de plugins Fastify e a configuração de OpenAPI.
- Pode exigir novas dependências ou utilitários para integrar Zod com validação Fastify e exportação OpenAPI.
- Impacta indiretamente `packages/api-client`, já que ele depende do `openapi.json` gerado pela API.

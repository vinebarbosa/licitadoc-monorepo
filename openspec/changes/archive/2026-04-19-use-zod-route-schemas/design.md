## Context

A API em `apps/api` registra rotas Fastify com objetos `schema` baseados em JSON Schema manual, concentrados em arquivos como `users.schemas.ts`, `organizations.schemas.ts`, `processes.schemas.ts` e `documents.schemas.ts`. O documento OpenAPI nasce dessas definições por meio de `@fastify/swagger`, é exposto em `/openapi.json`, depois consumido pelo `packages/api-client` para gerar o cliente e hooks.

Hoje `zod` já está disponível no projeto e é usado para validar variáveis de ambiente, mas não participa do contrato HTTP das rotas. Isso mantém validação runtime, tipos TypeScript e exportação OpenAPI em trilhas separadas, o que aumenta custo de manutenção e risco de divergência.

## Goals / Non-Goals

**Goals:**
- Tornar `zod` a fonte única dos contratos HTTP das rotas mantidas pela aplicação.
- Preservar validação runtime para `params`, `querystring`, `body` e `response`.
- Preservar a geração do OpenAPI e a compatibilidade com `packages/api-client`.
- Permitir migração incremental dos módulos atuais sem reescrever a lógica de negócio.

**Non-Goals:**
- Reestruturar handlers, policies ou acesso a dados.
- Alterar o contrato das rotas do Better Auth além do necessário para continuar mesclando sua spec.
- Redesenhar o pipeline de geração do cliente além do necessário para continuar consumindo `/openapi.json`.

## Decisions

### 1. Usar Zod como fonte de verdade dos schemas HTTP da aplicação

Os arquivos `*.schemas.ts` da API passarão a exportar schemas Zod para entidades, `params`, `querystring`, `body` e `response`. Esses schemas serão a definição canônica dos contratos HTTP mantidos pela aplicação.

Isso reduz a duplicação entre validação e tipagem e cria uma base consistente para rotas futuras, inclusive onde hoje ainda não há `body` ou `querystring`.

Alternativas consideradas:
- Manter JSON Schema manual e adicionar tipos TypeScript ao lado: reduz pouco a duplicação e não atende ao objetivo de adotar Zod.
- Declarar Zod e JSON Schema em paralelo: cria duas fontes de verdade e tende a divergir.

### 2. Centralizar a integração Zod/Fastify/OpenAPI no bootstrap da API

A mudança deve introduzir uma camada central de integração na inicialização do Fastify para que as rotas possam declarar schemas Zod sem conversões manuais por handler. Essa camada deve cobrir:
- compilação/validação de requests com Zod;
- serialização/validação de responses quando suportado pela integração escolhida;
- transformação dos schemas Zod para OpenAPI no fluxo já usado por `@fastify/swagger`.

O objetivo é que os módulos de rota continuem declarativos e que a complexidade de adaptação fique concentrada em plugins/utilitários de infraestrutura.

Alternativas consideradas:
- Validar com `schema.parse` dentro dos handlers: espalha validação, duplica responsabilidades e enfraquece o contrato Fastify.
- Converter Zod para JSON Schema manualmente em cada rota: cria boilerplate e aumenta o risco de inconsistência.

### 3. Preservar o contrato OpenAPI consumido pelo api-client

`packages/api-client` depende de um `/openapi.json` válido e estável o suficiente para o Kubb gerar cliente, modelos e hooks. Por isso, a migração para Zod não pode ser tratada apenas como detalhe interno de validação; ela também precisa manter o documento OpenAPI compatível com o pipeline atual.

Na prática, isso significa validar a exportação de `openapi.json` após a integração e regenerar o cliente para confirmar que os contratos derivados continuam utilizáveis.

Alternativas consideradas:
- Migrar apenas a validação runtime e deixar OpenAPI separado: simplifica o curto prazo, mas volta a criar múltiplas fontes de verdade.

### 4. Migrar os schemas por módulo, mas concluir a aplicação em todos os schemas próprios da API

A implementação deve seguir um caminho incremental: primeiro estabelecer a integração central, depois migrar os schemas próprios da aplicação (`health`, `organizations`, `users`, `processes`, `documents`) para o novo padrão. Durante a change, é aceitável coexistir temporariamente com estilos mistos, mas o resultado final da tarefa deve deixar os módulos da aplicação sob um padrão único.

Alternativas consideradas:
- Big bang sem etapa de infraestrutura explícita: aumenta o risco de retrabalho se a integração escolhida falhar.
- Migração parcial deixando módulos antigos em JSON Schema: preserva inconsistência estrutural.

## Risks / Trade-offs

- **[Compatibilidade da integração escolhida com Fastify 5 e `@fastify/swagger`]** → Mitigar validando a integração no bootstrap antes de migrar todos os módulos e encapsulando a adaptação em uma camada local.
- **[Diferenças no OpenAPI gerado a partir de Zod]** → Mitigar exportando `openapi.json` e regenerando `packages/api-client` para verificar que o Kubb continua aceitando o contrato.
- **[Mistura temporária entre JSON Schema e Zod durante a migração]** → Mitigar limitando essa coexistência ao período de implementação e concluindo a conversão dos schemas próprios da API na mesma change.
- **[Mudanças sutis na validação de response]** → Mitigar cobrindo pelo menos uma rota de listagem e uma rota de detalhe na verificação final.

## Migration Plan

1. Introduzir a integração central entre Zod, Fastify e OpenAPI.
2. Converter os schemas compartilhados e por módulo para Zod.
3. Ajustar o bootstrap/OpenAPI para continuar exportando `/openapi.json`.
4. Regenerar o `packages/api-client` e executar validações de typecheck/lint relevantes.

Rollback:
- Reverter a camada de integração Zod/Fastify/OpenAPI.
- Restaurar os arquivos `*.schemas.ts` para JSON Schema manual.
- Regenerar o OpenAPI e o cliente com o padrão anterior.

## Open Questions

- Qual integração concreta oferece a melhor compatibilidade com Fastify 5 no estado atual do projeto?
- Vamos introduzir utilitários compartilhados para primitives recorrentes, como UUID, email e paginação, já nesta change ou em uma mudança posterior?

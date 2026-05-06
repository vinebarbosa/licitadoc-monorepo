## Context

O backend ja possui `GET /api/processes` com paginacao e escopo por organizacao, mas hoje a resposta de cada item e basicamente o perfil do processo com `departmentIds`. A UI validada em `tmp/processos.tsx` precisa de uma listagem operacional mais rica: busca, filtros, status visual, tipo, responsavel, ultima atualizacao e progresso de documentos.

O frontend atual tem app shell, sidebar apontando para `/app/processos`, arquitetura modular documentada e cliente gerado a partir do OpenAPI. Ainda nao existe um modulo real de processos no web app; por isso a tela deve ser implementada como novo modulo, usando `tmp/processos.tsx` como referencia visual e nao como codigo de producao.

## Goals / Non-Goals

**Goals:**

- Preservar a interface validada de `tmp/processos.tsx` na pagina real `/app/processos`.
- Alimentar a tabela com dados reais de `GET /api/processes`, sem mocks locais.
- Evoluir a listagem backend com busca, filtros por status/tipo e resumo documental por processo.
- Calcular progresso documental por processo com base em `dfd`, `etp`, `tr` e `minuta`, contando cada tipo completo uma unica vez.
- Manter a autorizacao existente por organizacao e a paginacao atual.
- Regenerar o cliente de API quando o contrato OpenAPI mudar.

**Non-Goals:**

- Implementar detalhe de processo, criacao de processo ou documentos nesta change.
- Redesenhar a UI validada ou trocar a composicao visual por uma landing/hero.
- Criar um dashboard separado, cards analiticos ou endpoints de estatisticas globais.
- Alterar o modelo de documentos ou criar novos tipos documentais.
- Fazer migracao de banco salvo se a implementacao provar uma necessidade concreta.

## Decisions

### Decision: Evoluir `GET /api/processes` em vez de criar endpoint paralelo

A tela de processos consome uma listagem de processos, entao o contrato natural e o endpoint existente. A evolucao deve adicionar query params opcionais e campos adicionais por item, mantendo os campos atuais para compatibilidade.

Query params planejados:

- `page`
- `pageSize`
- `search`
- `status`
- `type`

`search` deve procurar, no minimo, em `processNumber`, `externalId`, `object` e `responsibleName`. `status` e `type` devem filtrar pelos valores persistidos atualmente no processo.

Alternatives considered:

- Criar `GET /api/processes/overview`: separa o contrato da UI, mas duplica autorizacao, paginacao e semantica de listagem antes de haver necessidade.
- Manter a API sem mudanca e agregar no frontend com `/documents`: obrigaria multiplas chamadas, criaria risco de N+1 no cliente e duplicaria regras de progresso documental fora do backend.

### Decision: Agregar documentos em lote para os processos da pagina

A listagem deve buscar a pagina de processos com filtros aplicados e depois consultar documentos relacionados aos `processId` retornados. A agregacao deve ocorrer em lote, por `processId`, evitando uma consulta por linha.

Para cada processo, o backend deve derivar:

- `documents.totalRequiredCount = 4`
- `documents.completedTypes`: tipos distintos entre `dfd`, `etp`, `tr`, `minuta` que tenham pelo menos um documento `completed`
- `documents.completedCount = completedTypes.length`
- `documents.missingTypes`: tipos esperados sem documento `completed`
- `listUpdatedAt`: maior data entre `process.updatedAt` e o maior `documents.updatedAt` relacionado ao processo

Se uma query agregada com `max(documents.updatedAt)` e agrupamento por processo/tipo ficar simples em Drizzle, ela deve ser usada. Caso fique pouco legivel, uma consulta dos documentos da pagina seguida de reducao em memoria e aceitavel porque opera somente sobre a pagina atual.

Alternatives considered:

- Persistir contadores no processo: reduz custo de leitura, mas exigiria sincronizacao em toda criacao/atualizacao de documentos e provavelmente migracao.
- Contar todos os documentos de todos os processos antes da paginacao: simples conceitualmente, mas pode crescer mal e nao e necessario para renderizar uma pagina.

### Decision: Separar `updatedAt` tecnico de `listUpdatedAt` operacional

O campo `updatedAt` do processo deve continuar representando a atualizacao do processo. A tabela deve usar um campo adicional derivado, como `listUpdatedAt` ou `lastActivityAt`, para refletir a atividade mais recente entre processo e documentos.

Isso evita mudar a semantica do campo persistido e permite que callers existentes continuem usando `updatedAt` como antes.

Alternatives considered:

- Sobrescrever `updatedAt` no serializer com a maior data: conveniente para a UI, mas confunde consumidores que esperam a data do processo.
- Atualizar `process.updatedAt` sempre que documento mudar: mistura ciclos de vida diferentes e cria efeitos colaterais desnecessarios.

### Decision: Criar modulo web `processes` seguindo a arquitetura atual

A pagina real deve viver em `apps/web/src/modules/processes`, com:

- `pages/processes-page.tsx` como entrypoint fino.
- `ui/processes-listing-page.tsx` ou componentes equivalentes para a composicao visual.
- `api/processes.ts` encapsulando hooks do `@licitadoc/api-client`.
- `model/processes.ts` com filtros, query params, formatadores, status config, type labels e helpers de progresso.
- `index.ts` exportando apenas o entrypoint publico.

A rota `/app/processos` deve ser adicionada no router sob `ProtectedAppRoute`, com handle de breadcrumb `Central de Trabalho > Processos`.

Alternatives considered:

- Colar `tmp/processos.tsx` diretamente em `pages`: rapido, mas preserva mocks, imports legados e dificulta testes.
- Colocar helpers em `shared`: prematuro, porque status, tipo e progresso documental sao regras da feature de processos.

### Decision: Estado de listagem controlado por URL

Busca, filtros e paginacao devem ser refletidos na URL para permitir restaurar e compartilhar a listagem. A UI pode manter debounce curto para busca textual, mas a fonte de verdade deve ser `searchParams`.

Alternatives considered:

- Estado local apenas no componente: mais simples, mas perde restauracao de filtros e diverge do padrao usado na tela administrativa.

## Risks / Trade-offs

- [Busca textual com `ilike` pode ficar limitada em datasets grandes] -> Comecar com filtros simples e escopo por organizacao; considerar indices/trigram apenas se dados reais exigirem.
- [Tipos de processo podem estar persistidos com nomes variados] -> Usar filtro exato contra `process.type` e mapear os valores conhecidos da UI; manter fallback exibindo o valor bruto.
- [Agregacao de documentos pode ficar pesada se a pagina for grande] -> Manter `pageSize` normalizado e agregar somente os processos retornados na pagina.
- [Paridade visual pode se perder na migracao] -> Usar `tmp/processos.tsx` como referencia direta de hierarquia, espacamento, tabela, filtros e badges, validando com testes e revisao visual.
- [Cliente gerado pode ficar desatualizado apos mudanca OpenAPI] -> Incluir geracao do `@licitadoc/api-client` como tarefa explicita.

## Migration Plan

1. Evoluir schema/query de `GET /api/processes` com `search`, `status` e `type`.
2. Implementar agregacao documental em lote para os processos da pagina e serializar os novos campos.
3. Atualizar testes unitarios/e2e de processos para busca, filtros, escopo e resumo documental.
4. Regenerar OpenAPI e `@licitadoc/api-client`.
5. Criar modulo web de processos e rota `/app/processos`.
6. Migrar a UI validada de `tmp/processos.tsx` para a pagina real com dados reais, loading, empty e erro.
7. Adicionar testes focados da pagina e validar o slice web/api tocado.

Rollback:

- Remover a rota web `/app/processos` ou voltar a pagina para placeholder se houver regressao de frontend.
- Reverter os campos/query params adicionais do endpoint se a agregacao causar regressao critica; como nao ha migracao planejada, rollback de banco nao deve ser necessario.

## Open Questions

Nenhuma para a primeira implementacao.

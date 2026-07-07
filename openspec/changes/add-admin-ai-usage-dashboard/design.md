## Context

O LicitaDoc ja registra execucoes de geracao em `document_generation_runs`. Cada run guarda `providerKey`, `model`, `status`, `requestMetadata` com tipo de documento, processo e organizacao, e `responseMetadata` com metadados de custo/tokens quando o provider ou a pipeline fornecem esses dados. A interface administrativa atual tem padrao bem definido: app shell com sidebar escura, pagina em `main p-6`, container `max-w-7xl`, cards compactos, filtros com input/select, tabelas shadcn e icones lucide.

A nova tela deve transformar esses metadados tecnicos em uma leitura administrativa de gasto e operacao. O v0 foi acionado em modo async no chat `gX2iCfYAIRy` e entregou uma proposta visual com toolbar compacta, segment control de periodo, cards de KPI com deltas, grafico de area para custo/erros, breakdown por modelo com barras e badges, e tabela de execucoes recentes. A implementacao deve usar esse resultado como referencia visual, mantendo compatibilidade com os componentes e tema existentes do projeto.

## Goals / Non-Goals

**Goals:**

- Expor uma tela admin-only em `/admin/ia/uso` para acompanhar gasto de IA em USD.
- Criar uma API agregada para resumo, tendencia, breakdowns e tabela de runs.
- Reutilizar `document_generation_runs` como fonte auditavel, sem duplicar dados em uma tabela financeira.
- Diferenciar custo conhecido, custo desconhecido e custo zero.
- Entregar uma interface madura, densa e responsiva, coerente com as telas admin atuais.

**Non-Goals:**

- Nao criar billing, faturas, repasse em BRL ou centro de custo contavel.
- Nao alterar prompts, modelos, qualidade de geracao ou fluxo de criacao de documentos.
- Nao exigir que provedores sem precificacao passem a simular custo.
- Nao criar alertas persistentes, budgets configuraveis ou exportacao financeira nesta primeira versao.

## Decisions

### 1. Criar um modulo API admin-only para uso de IA

A API deve ganhar um modulo dedicado, por exemplo `apps/api/src/modules/ai-usage`, registrado em `build-app.ts` com prefixo `/api/admin/ai-usage`. O endpoint inicial sera `GET /api/admin/ai-usage` e deve exigir `actor.role === "admin"` via `getSessionUser`; atores nao-admin recebem a resposta de autorizacao padrao.

Query params:

- `from` e `to` em ISO date/datetime, com default para os ultimos 30 dias.
- `organizationId`, `providerKey`, `model`, `documentType` e `status` opcionais.
- `page`, `pageSize` e `sort` para a tabela de runs, com `sort=recent` como default e `sort=cost_desc` para investigar runs caras.

Alternativa considerada: colocar o endpoint em `/api/documents/usage`. Isso misturaria leitura administrativa global com o modulo operacional de documentos e tornaria a autorizacao menos evidente.

### 2. Agregar em cima de runs existentes, com normalizador central

A primeira versao deve consultar `document_generation_runs` com joins em `documents`, `processes` e `organizations` para recuperar nome do documento, processo e organizacao. A fonte canonica de contexto deve ser o documento/processo armazenado; `requestMetadata.organizationId`, `requestMetadata.processId` e `requestMetadata.documentType` servem como fallback para linhas historicas ou payloads incompletos.

Um helper puro deve normalizar uma run para um formato interno:

- `costUsd`: primeiro `responseMetadata.pipeline.totalCostUsd`, depois `responseMetadata.costUsd`, senao `null`.
- `usage`: primeiro totais de `responseMetadata.pipeline`, depois `responseMetadata.usage`, senao zeros.
- `callCount`: `responseMetadata.pipeline.callCount`, tamanho de `pipeline.calls`, ou `1` quando houver metadado de provider unico.
- `costKnown`: `true` apenas quando `costUsd` for numero finito.
- `occurredAt`: `finishedAt ?? startedAt ?? createdAt`.

Runs com custo desconhecido contam em volume, tokens e falhas, mas nao entram no somatorio de gasto conhecido nem no custo medio. A UI deve mostrar a quantidade de runs com custo desconhecido para evitar interpretar ausencia de precificacao como economia.

Alternativa considerada: criar colunas relacionais para custo/tokens. Como os dados ja existem em JSONB e a primeira necessidade e observabilidade administrativa, o normalizador reduz escopo. Colunas ou materializacao podem vir depois se o volume exigir.

### 3. Retornar um payload agregado unico para a pagina

O endpoint deve retornar tudo que a pagina precisa em uma chamada, evitando coordenar varias queries no frontend:

```ts
type AdminAiUsageResponse = {
  filters: AppliedFilters;
  summary: {
    knownCostUsd: number;
    unknownCostRunCount: number;
    runCount: number;
    completedRunCount: number;
    failedRunCount: number;
    generatedDocumentCount: number;
    averageCostPerCompletedDocumentUsd: number | null;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCachedInputTokens: number;
    totalTokens: number;
    cacheInputTokenShare: number | null;
    failureRate: number | null;
  };
  trend: Array<{
    date: string;
    costUsd: number;
    runCount: number;
    failedRunCount: number;
    totalTokens: number;
  }>;
  breakdowns: {
    models: UsageBreakdownItem[];
    providers: UsageBreakdownItem[];
    documentTypes: UsageBreakdownItem[];
    organizations: UsageBreakdownItem[];
    statuses: UsageBreakdownItem[];
  };
  recentRuns: PaginatedRunList;
};
```

Breakdown items devem incluir `key`, `label`, `knownCostUsd`, `runCount`, `totalTokens`, `shareOfKnownCost` e `unknownCostRunCount`. Isso permite rank bars, badges e drilldown leve sem refetch por card.

### 4. Implementar a tela como dashboard operacional, nao landing page

A web deve criar `apps/web/src/modules/ai-usage` com API adapter, model helpers e pagina. A rota `/admin/ia/uso` fica protegida por `AdminOnlyRoute`, com breadcrumb `Admin > Uso de IA`, e a sidebar admin ganha item "Uso de IA" com icone lucide de custo/atividade.

Estrutura visual recomendada:

- Header compacto: titulo "Uso de IA", subtitulo operacional e acao de atualizar.
- Toolbar de filtros em duas linhas, como no v0: periodo rapido `7d / 30d / 90d / Personalizado` em segment control, contagem de execucoes, organizacao, modelo, tipo de documento, status e limpar filtros. No mobile, filtros quebram em grid sem sobrepor texto.
- KPI cards no estilo do v0: titulo pequeno em uppercase, icone em bloco sutil, valor tabular, delta e subvalor opcional. Os cards iniciais sao gasto conhecido, custo medio por documento, documentos gerados, tokens totais, entrada cacheada e taxa de falha.
- Corpo principal: grafico `AreaChart`/`LineChart` de custo e erro usando `ChartContainer`; ao lado, um painel de qualidade/cobertura com runs sem custo e falhas.
- Breakdowns: abas ou controle segmentado para modelo, provedor, organizacao, tipo de documento e status, com barras horizontais compactas, badges e percentuais como no breakdown de modelos do v0.
- Tabela: runs recentes ou mais caras, com badges para status/modelo/provedor, custo em USD, indicador "custo desconhecido" e link para documento/processo quando houver.

Estados de loading, empty e erro devem seguir os componentes existentes (`Skeleton`, `Empty`, `Button` com icone) e manter dimensoes estaveis para evitar layout shift.

### 5. Incorporar a direcao do v0 com adaptacao, nao copia cega

O resultado do v0 deve ser tratado como referencia de layout e composicao. Na aplicacao real, a implementacao deve:

- trocar dados mockados pelo payload do endpoint;
- substituir imports gericos por componentes existentes em `@/shared/ui`;
- manter tokens do tema atual, raio maximo de 8px e paleta institucional;
- trocar nomes de provedores/modelos mockados que nao pertencem ao ambiente atual por dados reais vindos da API;
- evitar qualquer hero, card decorativo aninhado ou texto explicando como usar a tela;
- validar via browser local que desktop e mobile nao tenham sobreposicao de filtros, cards, grafico ou tabela.

## Risks / Trade-offs

- **[Consulta pode ficar pesada com muitas runs]** -> Comecar com filtro de periodo padrao de 30 dias, paginacao na tabela e adicionar indice por data/status se a implementacao ou testes de volume mostrarem necessidade.
- **[Custo desconhecido pode distorcer decisao administrativa]** -> Separar `knownCostUsd` de `unknownCostRunCount` em API e UI.
- **[USD pode nao bater com leitura financeira brasileira]** -> Exibir USD como moeda fonte da precificacao de IA; BRL e cambio ficam fora do escopo inicial.
- **[Metadados historicos podem ser incompletos]** -> Usar fallbacks seguros e mostrar rotulos como "Nao informado" sem quebrar agregacoes.
- **[v0 pode gerar componentes fora do padrao local]** -> Usar a proposta para direcao visual, mas adaptar ao app shell, shadcn local, query hooks e `recharts` ja presentes.

## Migration Plan

1. Implementar schemas e servico de agregacao da API com testes unitarios de normalizacao.
2. Registrar o endpoint admin-only e regenerar o `@licitadoc/api-client`.
3. Criar pagina web, rota, sidebar e testes focados em autorizacao, filtros, estados e renderizacao de metricas.
4. Rodar typecheck/testes focados e revisar a tela no browser em desktop e mobile.

Rollback:

- Remover rota web/sidebar e o modulo `ai-usage`.
- Remover registro do endpoint admin e regenerar o cliente.
- Nenhuma migracao de dados e esperada na primeira versao; se um indice for adicionado, ele pode ser revertido por migracao propria.

## Open Questions

- Nenhuma em aberto para a primeira versao. Budgets, alertas, exportacao e conversao BRL devem ficar para uma change futura se o dashboard revelar essa necessidade.

## Context

`tmp/processo.tsx` contem a tela validada de detalhe do processo, mas ela esta fora da arquitetura atual e usa dados mockados. A arquitetura nova ja tem listagem de processos, criacao, shell protegido, breadcrumbs por rota e API client gerado. A rota `GET /api/processes/:processId` existe, mas retorna apenas o perfil basico do processo com `departmentIds`; a tela de detalhe precisa tambem de nomes de departamentos, valor estimado e estado dos documentos DFD, ETP, TR e Minuta.

O usuario pediu explicitamente para nao reinventar a UI: a migracao deve preservar a composicao visual da tela legada e da imagem de referencia, trocando apenas os imports/arquitetura e conectando dados reais.

## Goals / Non-Goals

**Goals:**

- Migrar a tela de `tmp/processo.tsx` para `apps/web/src/modules/processes` usando os componentes atuais de `@/shared/ui`.
- Registrar `/app/processo/:processId` dentro do shell protegido e manter breadcrumbs `Central de Trabalho > Processos > <numero>`.
- Fazer a pagina buscar `GET /api/processes/:processId` via React Query/API client e renderizar dados reais.
- Enriquecer o endpoint de detalhe para retornar departamentos resolvidos, valor estimado e cards dos documentos esperados.
- Manter a UI antiga como contrato visual: header, badges, card de informacoes, grid 2 colunas, icones, progress bar e acoes.
- Cobrir API, frontend unitario e e2e.

**Non-Goals:**

- Redesenhar a pagina de detalhe ou mudar a linguagem visual validada.
- Implementar edicao/visualizacao completa de processo ou documentos.
- Criar novos tipos de documento alem de DFD, ETP, TR e Minuta.
- Alterar a listagem de processos alem de garantir navegacao para o detalhe.
- Reestruturar o modelo de documentos.

## Decisions

### Decision: API de detalhe retorna payload rico, listagem permanece enxuta

`GET /api/processes/:processId` deve continuar retornando os campos existentes e acrescentar dados especificos de detalhe: `departments`, `estimatedValue`, `documents` detalhados e `detailUpdatedAt`/equivalente quando necessario. A listagem continua usando o agregado resumido atual.

Alternativas consideradas:

- Fazer o frontend chamar processos, departamentos e documentos separadamente: aumenta estados intermediarios e duplica regras de status.
- Reutilizar exatamente o payload da listagem: nao possui dados suficientes para nome de departamento, cards e links de documentos.

### Decision: Document cards sao derivados no backend

O backend deve montar sempre os quatro cards esperados a partir de `expectedProcessDocumentTypes` e dos documentos existentes do processo. Documentos ausentes aparecem como `pendente`; documentos existentes apontam `documentId`, status, data de atualizacao e progresso.

Alternativas consideradas:

- Montar os cards no frontend a partir de uma lista crua de documentos: espalha regra de dominio e aumenta risco de divergencia entre telas.
- Criar endpoint dedicado `/processes/:id/documents-summary`: mais endpoints para o mesmo carregamento inicial sem necessidade clara agora.

### Decision: UI migrada fica no modulo de processos

A pagina deve ser implementada como `ProcessDetailPage`/componente similar dentro de `apps/web/src/modules/processes`, exportada pelo modulo e registrada no router. O arquivo `tmp/processo.tsx` deve ser tratado como referencia, nao como dependencia runtime.

Alternativas consideradas:

- Importar diretamente de `tmp/`: mantem codigo legado fora dos limites arquiteturais.
- Recriar a tela do zero: contraria o pedido e arrisca perder a validacao visual.

### Decision: Links de acoes podem apontar para rotas futuras estaveis

Os botoes "Criar", "Editar" e "Visualizar" devem construir links consistentes com o padrao legado, mesmo que as telas de documento ainda nao estejam completas. Isso preserva a UX e permite evolucao incremental.

Alternativas consideradas:

- Desabilitar acoes ate as rotas existirem: quebra a UI validada e reduz utilidade.
- Fazer as acoes abrirem modais temporarios: inventa comportamento fora do escopo.

## Risks / Trade-offs

- [Risk] A UI pode mudar acidentalmente durante a migracao. -> Mitigacao: usar `tmp/processo.tsx` como referencia e adicionar teste que valide textos, cards, badges e acoes principais.
- [Risk] Campos como valor estimado podem nao existir para processos manuais. -> Mitigacao: API retorna `estimatedValue: null` e UI exibe fallback consistente.
- [Risk] Status de documentos da API (`generating`, `completed`, `failed`) nao mapeiam 1:1 para a UI legada. -> Mitigacao: documentar e testar mapeamento `completed -> concluido`, `generating -> em_edicao`, `failed -> erro`, ausente -> `pendente`.
- [Risk] A resposta de detalhe cresce. -> Mitigacao: enriquecer apenas endpoint de detalhe, nao a listagem.

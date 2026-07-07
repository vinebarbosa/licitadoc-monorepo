## Why

Os custos de IA da geracao de documentos ja sao registrados por execucao, mas hoje o admin precisa inspecionar dados tecnicos para entender gasto, tendencia e impacto por modelo. Com a escolha do modelo de geracao mais caro e a edicao usando outro modelo, a area administrativa precisa de uma leitura monetaria clara para controlar custo, qualidade operacional e anomalias.

## What Changes

- Adicionar uma tela admin-only de "Uso de IA" com resumo monetario em USD, consumo de tokens, documentos gerados, taxa de falha e custo medio por documento.
- Expor filtros por periodo, organizacao, modelo, provedor, tipo de documento e status, preservando o padrao de URL/query params usado nas telas administrativas.
- Criar visualizacao de tendencia de custo, detalhamentos por modelo/provedor/tipo/organizacao e tabela de execucoes recentes ou mais caras.
- Criar um endpoint agregado para admins consumirem metricas de `document_generation_runs` com joins suficientes para identificar documento, processo e organizacao.
- Normalizar a leitura de custos/tokens tanto do metadado consolidado da pipeline quanto de metadados legados de chamada unica, deixando valores desconhecidos explicitos em vez de mistura-los com zero.
- Adicionar estados de loading, empty e erro na interface, com layout responsivo coerente com o app shell atual.

## Capabilities

### New Capabilities

- `admin-ai-usage-dashboard`: leitura administrativa de custo monetario, consumo e execucoes de IA por periodo e filtros operacionais.

### Modified Capabilities

- `document-generation`: documentar que os metadados de execucao gravados em `document_generation_runs` sao a fonte auditavel para agregacao administrativa de custo/uso de IA.

## Impact

- API: novo endpoint admin-only para agregacao de uso de IA, schemas OpenAPI, testes de autorizacao/filtros/agregacao e regeneracao do cliente.
- Banco/dados: reutiliza `document_generation_runs`, `documents`, `processes` e `organizations`; pode precisar de indice adicional por data/status se a consulta exigir.
- Web: nova pagina em `/admin/ia/uso`, novo item na sidebar admin, hooks de API, componentes de dashboard/tabela/graficos e testes de UI.
- Design: seguir o app shell existente, componentes shadcn/Tailwind, `lucide-react`, `recharts`, cards compactos de raio ate 8px e copy em portugues brasileiro.

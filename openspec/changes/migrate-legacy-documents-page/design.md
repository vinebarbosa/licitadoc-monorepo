## Context

`tmp/documentos.tsx` contem a tela de documentos validada pelo produto, mas ela esta fora da arquitetura atual e usa dados mockados. O app shell ja expoe a navegacao para `/app/documentos` e links por tipo (`?tipo=dfd|etp|tr|minuta`), porem o router novo ainda nao registra essa pagina. No backend, `GET /api/documents` existe, mas hoje retorna apenas um resumo tecnico do documento, insuficiente para renderizar a tabela legada com contexto de processo e responsavel sem requisicoes adicionais por linha.

## Goals / Non-Goals

**Goals:**

- Migrar a tela validada de `tmp/documentos.tsx` para a arquitetura nova sem redesenhar a interface.
- Registrar a rota protegida `/app/documentos` e respeitar o deep link de tipo ja usado no sidebar.
- Consumir dados reais de documentos por um adaptador de modulo baseado no cliente gerado/React Query.
- Ajustar o payload da listagem de documentos apenas no necessario para renderizar cards de resumo, filtros e tabela a partir de um fluxo unico.
- Cobrir frontend e API com testes focados nos estados e contratos da nova pagina.

**Non-Goals:**

- Redesenhar a pagina ou trocar a hierarquia visual validada.
- Implementar fluxos completos de duplicacao, exclusao, preview ou edicao de documentos alem do que ja existir como rota estavel.
- Introduzir uma nova familia de endpoints so para estatisticas da tela se a listagem enriquecida ja atender o caso.
- Reestruturar o dominio de documentos alem do necessario para a listagem migrada.

## Decisions

### Decision: Criar um modulo frontend dedicado para documentos

A pagina migrada deve viver em `apps/web/src/modules/documents`, com pagina, adaptador de dados, helpers de exibicao e testes proprios. O router passa a importar o modulo e registrar `/app/documentos` dentro do shell protegido.

Alternativas consideradas:

- Colocar a pagina em `shared` ou `app`: enfraquece a separacao por workflow.
- Importar `tmp/documentos.tsx` diretamente: manteria dependencia runtime em codigo legado fora da arquitetura alvo.

### Decision: Enriquecer `GET /api/documents` com contexto de processo e responsavel, mantendo filtros da UI no frontend

O endpoint de listagem deve continuar como a fonte unica da pagina, mas passar a retornar em cada item os campos adicionais minimos para a tabela validada, como identificacao exibivel do processo e resumo de responsaveis. Os cards de resumo, a busca textual e os filtros por tipo/status podem ser derivados no frontend a partir da mesma resposta, evitando um endpoint extra de estatisticas na primeira iteracao.

Alternativas consideradas:

- Fazer uma busca adicional por processo para cada linha: gera efeito N+1 e complexidade desnecessaria.
- Criar endpoint separado de estatisticas: adiciona superficie de API sem resolver a falta de contexto por item.
- Levar toda a filtragem para a API agora: aumenta o escopo antes de provar que a listagem enriquecida basta para a migracao inicial.

### Decision: `tipo` em query string e o contrato minimo de navegacao da pagina

O filtro inicial de tipo deve ser lido de `searchParams` para manter compatibilidade com os links existentes do sidebar. Busca textual e filtro por status podem ser controlados localmente na primeira versao, desde que a troca de tipo continue refletida na URL quando o usuario interagir com o seletor correspondente.

Alternativas consideradas:

- Ignorar a query string e sempre abrir no estado padrao: quebraria os links ja publicados no shell.
- Sincronizar todos os filtros com a URL desde o inicio: util, mas nao necessario para entregar a migracao com o menor risco.

### Decision: Manter acoes visuais aprovadas, mas limitar comportamentos ao que ja existe ou ao feedback temporario explicito

O botao `Novo Documento`, os links de processo/documento e as acoes de linha devem preservar a apresentacao da tela legada. Quando uma acao ainda nao possuir fluxo completo suportado pela arquitetura nova, a pagina deve manter a affordance visual e usar feedback temporario nao destrutivo em vez de inventar mutacoes novas neste change.

Alternativas consideradas:

- Remover acoes nao prontas: descaracteriza a UI validada.
- Implementar exclusao/duplicacao completas no mesmo change: amplia demais o escopo e exige contratos novos nao pedidos.

## Risks / Trade-offs

- [Risk] A tela migrada pode divergir visualmente da referencia legada. -> Mitigacao: usar `tmp/documentos.tsx` como contrato visual e adicionar testes focados em cabecalho, cards, filtros e tabela.
- [Risk] O payload de `GET /api/documents` fica maior. -> Mitigacao: adicionar apenas os campos usados pela pagina e preservar os campos existentes para compatibilidade.
- [Risk] Filtragem local pode nao escalar para volumes muito altos. -> Mitigacao: manter a modelagem preparada para promover filtros para query params da API em um change futuro, se necessario.
- [Risk] Acoes temporarias podem gerar expectativa de funcionalidade completa. -> Mitigacao: limitar essas acoes a rotas estaveis ou feedback explicito, sem efeito colateral silencioso.
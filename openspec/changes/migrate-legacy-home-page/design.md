## Context

`/app` hoje renderiza `AppHomePage` como um placeholder vazio dentro do `AppShellLayout`. O shell ja controla sidebar, header, breadcrumbs e busca global, enquanto as telas reais de processos e documentos vivem em modulos com adapters de API, models e UI proprios.

A UI validada da Central de Trabalho esta em `tmp/dashboard.tsx` e usa uma composicao de quatro blocos: cabecalho da pagina com CTA, Acoes Rapidas, Continuar de onde parei e tabela de Processos de Contratacao. A migracao deve preservar essa experiencia visual, mas trocar imports legados por `@/shared/ui`, `react-router-dom` e helpers atuais.

## Goals / Non-Goals

**Goals:**

- Implementar a home autenticada em `/app` dentro do app shell atual.
- Preservar a UI validada de `tmp/dashboard.tsx` sem redesenhar layout, textos principais, cards, badges e tabela.
- Usar dados reais de `GET /api/processes` para a tabela de processos recentes.
- Manter "Continuar de onde parei" mockado e isolado, pronto para futura troca por contrato real.
- Adicionar estados de loading, vazio e erro para a tabela sem renderizar linhas mockadas de processos.
- Cobrir a pagina com testes focados em atalhos, mock de retomada e processos vindos da API.

**Non-Goals:**

- Criar endpoint de dashboard, estatisticas globais ou contrato real de retomada.
- Alterar a estrutura do shell, sidebar, header ou breadcrumbs globais.
- Redesenhar a UI validada ou transformar a home em landing page.
- Alterar criacao/edicao/detalhe de processos ou documentos.
- Regenerar cliente de API, salvo se a API precisar mudar.

## Decisions

### Decision: Implementar a home no modulo `app-shell`

A rota `/app` ja pertence ao app shell e a pagina inicial e uma composicao transversal de atalhos e resumo operacional. Por isso, o entrypoint deve continuar em `apps/web/src/modules/app-shell/pages/app-home-page.tsx`.

Alternatives considered:

- Criar novo modulo `dashboard`: separa o conceito, mas adiciona estrutura antes de existir um dominio proprio alem da pagina inicial.
- Colocar a UI em `shared`: inadequado porque a tela e especifica da experiencia autenticada.

### Decision: Reaproveitar `useProcessesList` e os helpers do modulo de processos

O endpoint `GET /api/processes` ja oferece processo, status, tipo, responsavel, resumo documental e `listUpdatedAt`. A home deve buscar uma pagina curta, sem filtros, por meio do adapter existente e formatar linhas com os helpers publicos atuais do modulo de processos.

Alternatives considered:

- Criar `GET /api/dashboard`: ficaria mais direto para a home, mas duplicaria contrato antes de haver estatisticas ou agregacoes exclusivas.
- Mockar processos na home: preservaria a UI, mas descumpriria o objetivo de implementar o que ja e possivel com dados reais.

### Decision: Manter "Continuar de onde parei" como mock local

O bloco deve usar uma constante local com os mesmos itens e progresso da UI validada. O codigo deve deixar claro que esses dados sao mockados para facilitar substituicao futura, sem esconder isso em API/model compartilhado.

Alternatives considered:

- Remover a secao ate existir API: quebraria a UI validada.
- Usar documentos reais como aproximacao: poderia sugerir uma semantica incorreta de retomada.

### Decision: Estados de tabela alinhados ao padrao existente

A home deve renderizar skeleton durante carregamento, empty state quando a API retornar lista vazia e erro com acao de tentar novamente. Esses estados seguem os padroes ja usados nas paginas de processos/documentos e evitam dados falsos em areas API-backed.

Alternatives considered:

- Exibir a tabela vazia sem mensagem: economiza codigo, mas prejudica orientacao do usuario.
- Reaproveitar a tabela inteira de processos: traz filtros/paginacao desnecessarios para a home e se afasta da UI validada.

## Risks / Trade-offs

- [A home passa a depender da listagem de processos] -> Usar loading/erro/vazio para degradar de forma clara e manter atalhos e retomada disponiveis.
- [Helpers de processos podem nao estar exportados publicamente] -> Exportar somente helpers necessarios no modulo de processos, sem acessar pastas internas a partir de rotas externas se isso violar o padrao local.
- [Paridade visual pode se perder ao remover o `AppHeader` legado] -> Preservar todo o conteudo interno da pagina e depender do header global equivalente ja existente no shell.
- [Mock de retomada pode parecer dado real] -> Limitar o mock a constante local e manter links/rotulos iguais ao legado ate existir contrato real.

## Migration Plan

1. Implementar `AppHomePage` com a composicao validada e imports atuais.
2. Conectar a tabela de processos ao adapter existente, com limite curto de itens.
3. Adicionar testes de pagina e ajustar fixtures MSW se necessario.
4. Rodar validacao web focada.

Rollback:

- Retornar `AppHomePage` ao placeholder anterior caso a tela cause regressao critica; nao ha migracao de banco ou contrato API a desfazer.

## Open Questions

Nenhuma para a primeira implementacao.

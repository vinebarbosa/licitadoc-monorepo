## Context

O app web já expõe a área administrativa de usuários em `/admin/usuarios`, com proteção para `admin` e navegação integrada ao shell autenticado. O gap atual está na própria implementação da página: `apps/web/src/modules/users/pages/admin-users-page.tsx` ainda é só um placeholder, enquanto `/tmp/usuarios.tsx` concentra a referência visual e operacional já validada pelo produto, porém acoplada a mocks, imports legados e uma estrutura monolítica que não cabe na arquitetura atual.

O documento de arquitetura de `apps/web` define `src/modules/users` como o boundary correto para essa feature, com responsabilidade por `pages`, `ui`, `model` e `api`, deixando `src/shared` apenas para primitivas realmente reutilizáveis. Isso significa que a migração precisa usar `/tmp/usuarios.tsx` apenas como referência de composição e estilos, sem importar runtime code do diretório temporário.

## Goals / Non-Goals

**Goals:**
- Migrar a interface de `/tmp/usuarios.tsx` para a feature real em `src/modules/users`, mantendo a hierarquia visual, os estilos e os principais estados da tela.
- Organizar a implementação em componentes e helpers locais do módulo, para que a página deixe de ser um arquivo monolítico e passe a seguir a arquitetura do web app.
- Conectar a UI migrada aos contratos reais de usuários, organizações e convites já disponíveis no produto.
- Preservar a rota atual, a proteção por papel, o estado via URL e as ações administrativas já suportadas pelo sistema.
- Cobrir os estados críticos da tela migrada com testes focados de rota e página.

**Non-Goals:**
- Alterar a rota canônica atual ou reabrir a discussão sobre navegação administrativa.
- Criar endpoints novos, mudar o contrato do backend ou introduzir agregações específicas só para a UI.
- Redesenhar a tela ou trocar o visual validado em `/tmp/usuarios.tsx`.
- Importar diretamente código de `/tmp` para produção ou promover para `src/shared` componentes que ainda carregam regras específicas do módulo de usuários.

## Decisions

### 1. O módulo `users` será o boundary de composição da tela migrada

A implementação deve viver em `apps/web/src/modules/users`, com a página atuando como entrypoint fino e a composição real distribuída entre componentes de `ui`, mapeadores de `model` e adaptadores de `api` quando necessário. A página deixa de conter toda a estrutura visual e passa a montar blocos como cabeçalho, cards de resumo, barra de filtros, tabela, estados vazios/loading e diálogos administrativos a partir de partes do próprio módulo.

Essa divisão segue a arquitetura já documentada para o app web e evita dois problemas do estado atual: o placeholder sem funcionalidade em produção e a tentação de colar o arquivo legado inteiro dentro de `pages/`.

Alternatives considered:
- Manter tudo em `admin-users-page.tsx`: menor esforço imediato, mas preserva o acoplamento e dificulta testes/evolução.
- Promover a maioria das peças para `src/shared`: dilui a responsabilidade da feature e espalha regras específicas de usuários fora do módulo.

### 2. A referência legada será reproduzida com os primitives atuais, preservando estilos e estrutura operacional

`/tmp/usuarios.tsx` define a hierarquia esperada: título e contexto administrativo, cards de resumo, filtros compactos, tabela com identidade do usuário, badges de papel, ações por linha, estados de loading/empty e paginação. A migração deve reconstruir essa estrutura usando os componentes atuais de `@/shared/ui` e a mesma linguagem visual do arquivo legado, sem reinterpretar o layout para outro desenho.

Preservar o visual não significa restaurar o domínio antigo. Os papéis e as ações da interface devem ser mapeados para o modelo atual do produto (`admin`, `organization_owner`, `member`) por meio de helpers locais, mantendo rótulos, badges e cópias coerentes com o backend real.

Alternatives considered:
- Copiar o arquivo de `/tmp` quase literalmente: acelera a primeira versão, mas traz imports errados, mocks e acoplamentos que violam a arquitetura.
- Reaproveitar a composição simplificada atual e só “aproximar” o visual: mantém a divergência que originou a change.

### 3. O estado da listagem continuará orientado por URL e contratos existentes

A tela migrada deve manter o comportamento já esperado pelo app atual: filtros, paginação e seleção de organização/papel devem continuar sincronizados com a URL e dirigindo consultas reais. A nova composição visual não deve introduzir estado paralelo que se afaste do router, nem depender de dados mockados para preencher cards, linhas ou estados intermediários.

Os cards de resumo e demais elementos derivados devem refletir os dados e metadados já disponíveis para a listagem atual. Quando não houver agregação dedicada no backend, o design desta change prioriza coerência com o conjunto carregado pela própria tela, evitando abrir dependências de API fora do escopo pedido.

Alternatives considered:
- Migrar a UI para estado totalmente local: simplifica o componente, mas perde deep-linking e restauração de filtros.
- Acrescentar uma API nova só para cards/resumos: aumenta escopo sem necessidade para a migração visual e estrutural.

### 4. As affordances legadas devem acionar os fluxos reais já suportados

O CTA principal da página continua sendo um fluxo administrativo de provisionamento, mas precisa usar o mecanismo existente de convites para `organization_owner`, e não criação direta de usuário. Da mesma forma, as ações por linha devem abrir os fluxos reais de inspeção, edição e remoção já compatíveis com o contrato atual, preservando a aparência compacta da tela antiga.

Isso mantém a interface fiel ao legado no ponto de vista operacional sem reintroduzir comportamentos que o domínio atual já descartou.

Alternatives considered:
- Recriar a ação legada de criação direta: visualmente próxima, mas funcionalmente incorreta para o produto atual.
- Expandir ações inline na tabela em vez de menu/diálogos compactos: muda o padrão visual esperado e piora a densidade informacional da página.

## Risks / Trade-offs

- **[Migrar visualmente um arquivo legado grande pode reintroduzir acoplamentos de infraestrutura]** -> Mitigar recriando a composição por partes dentro de `src/modules/users` e usando `/tmp/usuarios.tsx` apenas como referência.
- **[Paridade visual com dados reais pode expor diferenças entre o mock legado e o domínio atual]** -> Mitigar com mapeadores locais de papel, labels e estatísticas coerentes com `admin`, `organization_owner` e `member`.
- **[Cards de resumo podem sugerir agregações não disponíveis no backend]** -> Mitigar limitando os resumos aos dados/metadados já fornecidos pela experiência atual, sem expandir escopo de API.
- **[Quebrar a página em vários componentes pode deslocar estilos ou espaçamentos]** -> Mitigar centralizando classes visuais próximas dos blocos migrados e validando desktop/mobile com testes e revisão visual focada.

## Migration Plan

1. Levantar a composição necessária a partir de `/tmp/usuarios.tsx` e decompor a tela em blocos do módulo `users` (`page`, componentes locais, mapeadores e adaptadores).
2. Implementar a tela real em `apps/web/src/modules/users` preservando a linguagem visual legada e conectando cada bloco aos dados e mutações atuais.
3. Atualizar testes da rota e da página para cobrir renderização do layout migrado, estados principais e fluxos administrativos essenciais.
4. Validar o slice tocado com checks focados do web app.

Rollback:
- Reverter a composição do módulo de usuários para o placeholder atual, caso a migração introduza regressões críticas.
- Isolar blocos visuais problemáticos em follow-ups sem alterar a rota ou os contratos de dados existentes.

## Open Questions

Nenhuma.
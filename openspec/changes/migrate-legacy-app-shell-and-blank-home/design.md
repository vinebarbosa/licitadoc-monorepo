## Context

`apps/web` já possui uma landing page pública migrada, fluxo de autenticação, guardas de rota e páginas de fallback, mas ainda não tem um app shell interno conectado ao router atual. O layout legado desse shell existe apenas em `tmp/app-layout.tsx`, `tmp/app-header.tsx` e `tmp/app-sidebar.tsx`, com aliases antigos e dependências que não podem ser usadas diretamente como runtime code no frontend atual.

Ao mesmo tempo, a landing page pública ainda expõe um switch de tema visível no header. Esse controle foi útil para validar dark mode, mas agora conflita com a meta de deixar a experiência pública mais enxuta enquanto o theme system continua existindo no nível da aplicação.

O pedido combina três frentes do mesmo fluxo web: introduzir um shell interno reutilizável, criar uma home inicial intencionalmente vazia dentro desse shell e simplificar a landing page removendo o controle visual de tema.

## Goals / Non-Goals

**Goals:**
- Migrar o app shell legado de `tmp` para código runtime em `apps/web` usando os limites atuais de app, modules e shared UI.
- Expor uma rota base `/app` com shell interno e home inicial vazia.
- Reusar os guardas e adapters de autenticação já existentes para tratar `/app` como área interna.
- Remover o switch de tema da landing page sem desmontar a infraestrutura global de tema.
- Adicionar cobertura focada para a landing simplificada e para a nova rota base do shell.

**Non-Goals:**
- Preencher a nova home com widgets, métricas, listas ou dados reais.
- Redesenhar profundamente o layout legado além do necessário para adequá-lo à arquitetura atual.
- Remover o suporte global a light/dark mode da aplicação.
- Reescrever o fluxo de autenticação ou introduzir novos contratos de backend.

## Decisions

### Decision: Mount the migrated shell under `/app` and keep `/` as the public landing route
O shell legado deve entrar no router como área interna distinta, sob `/app`, em vez de substituir a landing pública em `/`. Isso preserva a separação entre entrada pública e área autenticada, além de alinhar os links e intenções já presentes no layout legado.

Alternatives considered:
- Reaproveitar `/` como home vazia do shell.
  Rejected because isso desmontaria a landing recém-migrada e misturaria dois contextos de navegação diferentes.
- Inserir o shell diretamente dentro do layout raiz atual sem subtree própria.
  Rejected because isso enfraqueceria a clareza do router e dificultaria a expansão futura de rotas internas.

### Decision: Adapt the legacy shell into current app/shared boundaries instead of importing `tmp` files directly
Os arquivos de `tmp` devem servir apenas como fonte de migração. A implementação final deve mover a composição do shell para código regular em `apps/web`, usando `react-router-dom`, `@/shared/ui` e os padrões documentados da arquitetura atual.

Alternatives considered:
- Importar os componentes diretamente de `tmp` até concluir a refatoração.
  Rejected because isso manteria runtime code fora da árvore modular suportada e perpetuaria aliases legados.
- Copiar o layout inteiro para um único arquivo novo sem reorganização.
  Rejected because isso dificultaria manutenção e reduziria a aderência aos limites atuais entre app composition e módulos.

### Decision: Use the existing session-aware guard for `/app`
A nova rota do shell deve ser tratada como área autenticada e reaproveitar o comportamento já existente de guardas por sessão. Isso evita duplicação de lógica de acesso e mantém o shell coerente com o fluxo de login recém-migrado.

Alternatives considered:
- Deixar `/app` público até existir conteúdo real.
  Rejected because o shell legado representa uma área interna da aplicação, não uma página pública.
- Embutir checagem de sessão dentro da própria página home.
  Rejected because isso duplicaria decisões que já pertencem à camada de roteamento.

### Decision: Keep the home intentionally blank and restrict the landing simplification to visible controls
A nova home deve ser deliberadamente vazia, servindo como placeholder estrutural dentro do shell sem inventar conteúdo de produto. Na landing, a mudança deve se limitar à remoção do switch de tema visível; a infraestrutura de tema permanece disponível para outros fluxos que precisem dela.

Alternatives considered:
- Preencher a home com cards ou métricas temporárias.
  Rejected because isso introduziria comportamento não solicitado e aumentaria retrabalho.
- Remover toda a infraestrutura global de tema junto com o switch.
  Rejected because o pedido é sobre a UI da landing, não sobre desativar o tema da aplicação.

### Decision: Validate with focused route and component coverage
Os testes devem cobrir a presença da landing simplificada e a renderização/roteamento do shell base em `/app`, incluindo o comportamento esperado de acesso. Isso fornece um sinal rápido sem precisar expandir para cobertura end-to-end pesada além do necessário.

Alternatives considered:
- Confiar apenas em validação manual.
  Rejected because a composição de rotas e guards é barata de testar e fácil de regredir.

## Risks / Trade-offs

- [Risk] O layout legado depende de aliases e padrões antigos que podem não encaixar diretamente no frontend atual. → Mitigation: tratar `tmp` apenas como referência e adaptar imports/composição para os limites atuais.
- [Risk] Uma home vazia pode parecer incompleta para quem navegar autenticado. → Mitigation: documentar explicitamente que ela é um placeholder estrutural intencional.
- [Risk] A remoção do switch da landing pode deixar a infraestrutura de tema sem um ponto público óbvio de teste manual. → Mitigation: manter a infraestrutura e, se necessário, expor controles de tema em áreas internas ou testes, não na landing pública.

## Migration Plan

Implementar a mudança no frontend em uma sequência curta: migrar o shell legado para `apps/web`, adicionar a rota protegida `/app` e a home vazia, remover o switch de tema da landing e então atualizar os testes focados. Se for necessário rollback, basta remover a subtree `/app` e restaurar o controle visual da landing sem impactar contratos de backend.

## Open Questions

Nenhuma. O pedido é suficientemente específico para propor a rota `/app` como base do shell e manter a home inicial sem conteúdo.
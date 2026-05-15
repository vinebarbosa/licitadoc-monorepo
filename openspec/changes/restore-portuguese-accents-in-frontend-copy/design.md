## Context

O frontend mistura textos corretamente escritos em PT-BR com várias strings sem acentos, como mensagens de erro, labels, estados e descrições em telas reais e demos públicas. Parte desse problema veio de escolhas locais para manter ASCII em edição de código, mas isso vazou para a experiência final do produto. A correção é transversal porque a cópia está espalhada entre páginas, componentes, helpers de apresentação e testes.

## Goals / Non-Goals

**Goals:**
- Corrigir a acentuação de textos visíveis ao usuário em rotas autenticadas e demos públicas.
- Aplicar um critério consistente para revisar headings, labels, descrições, badges, toasts e estados vazios.
- Atualizar testes para refletir a cópia final exibida em PT-BR.
- Preservar o comportamento funcional das telas enquanto a revisão textual é aplicada.

**Non-Goals:**
- Reescrever toda a redação do produto ou alterar tom de voz além do necessário para corrigir ortografia e acentuação.
- Traduzir identificadores técnicos, nomes de tipos, enums, payloads, slugs, rotas ou chaves de i18n inexistentes.
- Alterar conteúdo de documentos gerados pelo backend fora do que é efetivamente renderizado pela interface web.

## Decisions

### 1. Tratar o trabalho como uma auditoria de cópia visível ao usuário
Vamos revisar apenas strings que aparecem na UI final, incluindo toasts e estados transitórios visíveis. Isso evita alterações indiscriminadas em nomes internos, fixtures puramente técnicas ou texto de infraestrutura.

Alternativas consideradas:
- Corrigir qualquer string em português no repositório: simples, mas arriscado e propenso a ruído.
- Limitar o ajuste só às páginas públicas: insuficiente, porque o problema também está em fluxos autenticados centrais.

### 2. Corrigir na origem onde a string é definida
As correções devem acontecer no ponto de definição de cada mensagem: componente, helper de apresentação ou página. Isso reduz divergência entre telas, evita pós-processamento artificial e mantém testes alinhados com a origem real da cópia.

Alternativas consideradas:
- Aplicar transformação global em runtime: frágil, difícil de auditar e propensa a efeitos colaterais.
- Centralizar tudo em um dicionário novo antes de corrigir: melhoria possível depois, mas maior escopo do que o pedido atual.

### 3. Atualizar testes que verificam texto renderizado
Como parte da change, testes do frontend que hoje esperam versões sem acento devem passar a validar a cópia correta. Isso garante regressão visível e impede retorno do problema em áreas já revistas.

Alternativas consideradas:
- Não atualizar testes textuais: deixaria a suíte desalinhada da UI real.
- Relaxar asserts para regex genérica demais: reduz valor de proteção para a qualidade textual.

### 4. Preservar critérios de exceção explícitos
Strings técnicas como slugs, códigos de processo, nomes de campos de payload e exemplos que não chegam à interface não entram na revisão. Quando um fixture sem acento for usado na UI visível, ele deverá ser corrigido apenas no contexto necessário para a renderização/teste.

Alternativas consideradas:
- Uniformizar inclusive fixtures e dados internos em massa: pode misturar revisão textual com limpeza estrutural desnecessária.

## Risks / Trade-offs

- **Cobertura incompleta da auditoria** → Mitigação: começar por busca ampla de padrões sem acento em áreas renderizadas e complementar com revisão por fluxo.
- **Mudança de testes em cascata** → Mitigação: focar primeiro nos testes que validam texto visível e evitar refactors paralelos.
- **Correção indevida de texto não voltado ao usuário** → Mitigação: aplicar o critério de “aparece na UI final?” antes de alterar cada ocorrência.
- **Diferença entre app autenticado e demos públicas** → Mitigação: incluir explicitamente páginas públicas e componentes compartilhados no escopo da revisão.

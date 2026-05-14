## Context

O app web já possui um fluxo autenticado maduro para criação de processos e uma página de detalhe que expõe a ação `Editar`, mas ainda não existe a rota protegida de edição. Ao mesmo tempo, a API necessária já está disponível: o detalhe do processo devolve os campos e itens necessários para prefill, e o backend já expõe `PATCH /api/processes/:processId` para persistir atualizações.

Isso faz a mudança ser majoritariamente de frontend, mas com um cuidado arquitetural importante: a edição precisa nascer como uma extensão do formulário de criação, não como uma segunda implementação paralela do mesmo wizard.

## Goals / Non-Goals

**Goals:**
- Entregar uma página protegida em `/app/processo/:processId/editar`.
- Reutilizar a estrutura, as etapas, as validações e o resumo do formulário autenticado de criação.
- Carregar os dados atuais do processo pela API e convertê-los para o estado do wizard de edição.
- Persistir alterações pelo endpoint existente de update e redirecionar para o detalhe após sucesso.
- Tornar funcional a navegação a partir da ação `Editar` já exibida no detalhe do processo.

**Non-Goals:**
- Alterar contratos backend de processo, departamentos ou organizações.
- Introduzir edição de status do processo ou de organização do processo.
- Redesenhar o wizard de criação.
- Implementar autosave, histórico de alterações ou detecção de diff campo a campo.

## Decisions

1. Compartilhar a implementação base do wizard entre criação e edição.

   Rationale: o pedido do produto é usar o formulário de criação como base. Extrair a estrutura compartilhada reduz drift visual e comportamental entre criar e editar, especialmente nas etapas, validações de itens e resumo final.

   Alternative considered: duplicar `process-create-page.tsx` e adaptar a cópia para edição. Isso acelera o primeiro commit, mas tende a quebrar paridade rápido e espalha correções futuras em dois fluxos quase idênticos.

2. Usar `GET /api/processes/:processId` como fonte de prefill e `PATCH /api/processes/:processId` como persistência.

   Rationale: o detalhe já expõe `departmentIds`, `items` e os demais campos editáveis, então não há necessidade de endpoint novo. O frontend só precisa de um adapter para transformar a resposta do detalhe no shape do formulário.

   Alternative considered: criar um endpoint dedicado de “edit payload”. Isso adicionaria contrato sem benefício imediato, porque o payload necessário já existe.

3. Tratar organização como escopo fixo no modo de edição, inclusive para admin.

   Rationale: o contrato atual de update não permite mover o processo para outra organização. Portanto, o wizard de edição deve mostrar a organização resolvida, mas não oferecer troca de organização como faz a criação para admins.

   Alternative considered: manter o seletor de organização ativo para admin. Isso induziria uma capacidade que a API não suporta e criaria uma UX enganosa.

4. Preservar o status atual do processo sem criar um controle novo no wizard.

   Rationale: o formulário base de criação não possui editor de status, e o pedido do usuário é editar “os dados do processo” usando esse fluxo como base. A página de edição deve atualizar os campos já representados no wizard e deixar o status fora de escopo por enquanto.

   Alternative considered: adicionar um seletor de status só no modo de edição. Isso aumentaria a divergência entre create/edit e abriria uma decisão de produto não pedida.

5. Após sucesso, navegar de volta para o detalhe do processo.

   Rationale: o detalhe é o destino natural depois da edição e já concentra as ações seguintes do usuário. Isso também reduz a necessidade de manter duas representações sincronizadas localmente após o update.

   Alternative considered: permanecer na tela de edição com toast de sucesso. Funciona, mas não fecha tão bem o ciclo iniciado pelo botão `Editar` do detalhe.

## Risks / Trade-offs

- [Risk] Reuso mal recortado pode deixar o create page mais complexo do que precisa. -> Mitigation: extrair apenas o núcleo compartilhado do wizard e manter adapters de create/edit nas páginas de borda.
- [Risk] O mapeamento de `items` e `components` entre detalhe e formulário pode introduzir bugs sutis. -> Mitigation: cobrir prefill e submit com testes focados no modo de edição.
- [Risk] Admins podem estranhar não conseguir trocar a organização no modo de edição. -> Mitigation: manter a organização visível, mas como contexto fixo coerente com o contrato atual da API.

## Migration Plan

1. Extrair ou estruturar um componente/base compartilhada do wizard de processo.
2. Adicionar adapter de leitura do detalhe para valores iniciais do formulário.
3. Adicionar mutation de update na camada `api` do módulo.
4. Registrar a rota `/app/processo/:processId/editar` e conectar a ação `Editar` do detalhe.
5. Atualizar testes do fluxo de edição.

Não há migração de banco nem mudança obrigatória de contrato de API.

## Open Questions

Nenhuma aberta no momento. A API atual já suporta o fluxo pretendido, então o trabalho fica concentrado em UX, roteamento e reaproveitamento seguro do formulário.

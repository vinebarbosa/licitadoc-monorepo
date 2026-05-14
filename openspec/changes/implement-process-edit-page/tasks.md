## 1. Shared Process Form Foundation

- [x] 1.1 Extrair do fluxo de criação a base compartilhada do wizard de processo para suportar modos `create` e `edit` sem duplicar a UI principal.
- [x] 1.2 Adicionar helpers para mapear o detalhe do processo da API para os valores iniciais do formulário e para serializar o estado editado no payload canônico de update.
- [x] 1.3 Preservar no modo de edição a organização como contexto fixo e manter as unidades e itens compatíveis com o wizard existente.

## 2. Edit Route And API Integration

- [x] 2.1 Expor no módulo de processos o consumo do detalhe e da mutation de atualização necessários para a página de edição.
- [x] 2.2 Implementar a página protegida `/app/processo/:processId/editar` com carregamento inicial, prefill do wizard, estados de erro e salvamento via API.
- [x] 2.3 Registrar a rota de edição no router do app shell e garantir que a navegação a partir do detalhe leve a essa página funcional.
- [x] 2.4 Redirecionar o usuário para o detalhe do processo após atualização bem-sucedida e manter erros de API dentro do contexto do formulário.

## 3. Frontend Tests And Verification

- [x] 3.1 Adicionar testes React para o fluxo de edição cobrindo prefill, envio do payload de update e tratamento de erro/not-found.
- [x] 3.2 Atualizar testes de roteamento ou detalhe para cobrir a rota protegida de edição do processo.
- [x] 3.3 Executar os testes focados do módulo de processos afetados pelo novo fluxo de edição.

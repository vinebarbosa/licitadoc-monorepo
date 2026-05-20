## Context

O frontend web usa React, Tailwind e componentes compartilhados em `apps/web/src/shared/ui`. O componente `Input` atual estiliza inputs comuns e também inputs de arquivo, mas quando `type="file"` fica visível o navegador ainda controla parte da UI e mostra cópias como "Choose File" / "No file chosen". Isso aparece no modal `Importar SD` e no onboarding de `Papel timbrado`, dois fluxos de alta confiança.

A paleta atual é institucional e sóbria: superfícies claras quase neutras (`--background: oklch(0.985 0.002 250)`), texto em slate frio (`--foreground: oklch(0.2 0.02 250)`), cartões brancos, bordas cinza-azuladas (`--border: oklch(0.9 0.01 250)`) e azul institucional como cor primária/foco (`--primary` e `--ring` em hue 230). As cores de status já existem para sucesso, alerta, erro e processamento. O refinamento deve usar esses tokens sem criar uma paleta paralela.

## Goals / Non-Goals

**Goals:**
- Remover texto nativo do navegador da experiência visível de upload.
- Exibir todos os rótulos, ações, estados vazios, estados selecionados e erros em PT-BR.
- Criar uma UI compacta, adulta e coerente com software B2B/governo, evitando composição promocional.
- Preservar seleção de arquivos, validações, loading, erro, remoção e acessibilidade por label.
- Reaproveitar um padrão comum entre SD e papel timbrado quando isso reduzir duplicação real.

**Non-Goals:**
- Alterar endpoints, formatos de upload, limites aceitos ou armazenamento.
- Introduzir drag-and-drop obrigatório se isso aumentar complexidade sem ganho imediato.
- Redesenhar o fluxo completo de criação de processo ou onboarding.
- Trocar a paleta global do produto.

## Decisions

1. **Esconder o input nativo e expor um controle próprio**
   - Usar `input type="file"` visualmente oculto, mantendo `id`, `accept`, `onChange` e associação com label/controle.
   - O usuário interage com uma área/botão estilizado com lucide icon, texto em PT-BR e estado selecionado.
   - Alternativa considerada: estilizar `file:` no `Input` atual. Isso ainda deixa comportamento e cópia parcialmente dependentes do navegador, que é o problema principal.

2. **Criar padrão compartilhável, mas manter API simples**
   - Se ambos os fluxos puderem usar a mesma estrutura, criar um primitivo pequeno em `apps/web/src/shared/ui`, por exemplo `FileUploadField`.
   - O componente deve receber `label`, `description`, `accept`, `fileName`, `fileSize`, `error`, `disabled`, `onFilesChange` e `onRemove`.
   - Alternativa considerada: duplicar markup nos dois módulos. É aceitável para prototipar, mas menos adequado porque os dois problemas são a mesma classe de UI.

3. **Tratar SD e papel timbrado como variações do mesmo padrão**
   - SD: área mais compacta dentro do dialog, com ação "Selecionar PDF", texto auxiliar "PDF da Solicitação de Despesa" e estado "Nenhum arquivo selecionado" ou nome do arquivo.
   - Papel timbrado: área dentro da seção de onboarding, com ação "Selecionar imagem", formatos aceitos, tamanho máximo, card de arquivo selecionado e "Remover".
   - A variação não deve criar outro cartão dentro do cartão; usar uma faixa/área única com borda sutil e alinhamento responsivo.

4. **Preservar testes por acessibilidade**
   - Os testes existentes usam `getByLabelText("Arquivo PDF da SD")` e `getByLabelText("Papel timbrado da organização")`.
   - A implementação deve manter esses nomes acessíveis no input oculto ou ajustar os testes para selecionar pelo novo label acessível equivalente, sem depender de texto em inglês do navegador.

## Risks / Trade-offs

- **Risco: input oculto perder acessibilidade** -> Mitigar mantendo label associada, foco visível no controle acionador e suporte a teclado.
- **Risco: upload parecer grande demais em dialog compacto** -> Mitigar com dimensões estáveis, copy curta e layout responsivo em uma única coluna no mobile.
- **Risco: novo primitivo ficar abstrato demais** -> Mitigar com API mínima orientada pelos dois casos atuais, sem drag-and-drop avançado neste primeiro passo.
- **Risco: testes quebrarem por mudança de label** -> Mitigar atualizando testes para labels PT-BR finais e cobrindo seleção, remoção e erro.

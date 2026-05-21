## Context

A mudança `refine-upload-controls-pt-br` introduziu o `FileUploadField` para substituir inputs nativos visíveis por uma superfície própria do Licitadoc. A primeira versão resolve localização e maturidade básica, mas a interação ainda é mais parecida com uma linha de seleção do que com uma área de anexo. O próximo refinamento é adicionar affordance de dropzone, mantendo a densidade visual necessária para software operacional.

Os dois usos principais têm pesos diferentes:
- `Importar SD`: precisa de uma dropzone baixa e compacta dentro do dialog, sem tomar a hierarquia da prévia extraída.
- `Papel timbrado`: pode ser um pouco mais generoso, pois é uma seção própria do onboarding, mas ainda deve caber como uma área única dentro do formulário.

## Goals / Non-Goals

**Goals:**
- Adicionar suporte a arrastar-e-soltar no padrão compartilhado de upload.
- Comunicar visualmente que o usuário pode arrastar arquivo ou selecionar pelo computador.
- Manter todos os textos visíveis em PT-BR.
- Preservar acessibilidade, seleção por label, validações e remoção.
- Evitar dropzones grandes demais, com aparência promocional ou pouco densa.

**Non-Goals:**
- Reimplementar upload, armazenamento ou validação backend.
- Criar múltiplos arquivos por upload.
- Adicionar previews de PDF ou imagem nesta mudança.
- Trocar paleta, tokens globais ou layout geral dos fluxos.

## Decisions

1. **Evoluir `FileUploadField` em vez de criar outro componente**
   - O comportamento base já existe: input oculto, label acessível, estado selecionado, erro e remoção.
   - A mudança deve acrescentar drag-and-drop, estados de drag e copy própria ao mesmo componente.
   - Alternativa considerada: criar `DropzoneUploadField`; isso duplicaria API e exigiria decidir entre dois padrões para a mesma tarefa.

2. **Usar variações compactas por contexto**
   - Para SD, a variante deve renderizar uma faixa de cerca de uma linha alta, com ícone, texto "Arraste o PDF aqui ou selecione o arquivo" e subtexto curto.
   - Para papel timbrado, a variante pode ter mais respiro vertical, com texto "Arraste a imagem aqui ou selecione do computador" e formatos aceitos.
   - Ambas devem manter raio máximo de 8px, bordas sutis e realce primário apenas em hover/focus/drag.

3. **Tratar drag-and-drop como melhoria progressiva**
   - Clique no botão/área e seleção via label continuam obrigatórios.
   - Drag-and-drop deve usar o primeiro arquivo solto e passar o mesmo `FileList`/arquivo ao fluxo de validação existente.
   - Quando o arquivo não for aceito, a validação existente continua produzindo a mensagem final.

4. **Estados visuais mínimos e sem ruído**
   - Vazio: borda tracejada sutil, ícone de upload, copy curta.
   - Arrastando: borda `primary`, fundo `primary/5` ou `accent/40`, sem animação exagerada.
   - Selecionado: arquivo, tamanho, ação de remover, mantendo a área no mesmo tamanho aproximado.
   - Erro: borda/fundo destrutivos e mensagem abaixo.

## Risks / Trade-offs

- **Risco: dropzone tomar espaço demais no modal** -> Mitigar com variante compacta para SD e checagem visual em viewport desktop.
- **Risco: drag-and-drop quebrar testes baseados em label** -> Mitigar mantendo o input nativo oculto com os mesmos labels.
- **Risco: estado de drag causar flicker** -> Mitigar usando contadores ou handlers simples que limpam estado em `drop`/`dragleave` e não dependem de áreas aninhadas complexas.
- **Risco: visual ficar lúdico demais** -> Mitigar usando tokens existentes, borda discreta, copy curta e nenhuma ilustração.

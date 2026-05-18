## Context

O LicitaDoc já gera e salva documentos formais em Markdown/TipTap JSON, e o preview concluído já possui ações de imprimir/exportar. A camada atual de folha, paginação visual e impressão, porém, é composta por CSS e medições próprias. Isso é frágil para timbre em página cheia, repetição de cabeçalho/rodapé, contadores de página, tabelas longas e documentos extensos como ETP, TR, contratos e ofícios.

Paged.js resolve uma parte importante desse problema: ele implementa paginação HTML paged media no navegador, cria páginas físicas A4, entende `@page`, margin boxes, contadores e regras de quebra. A mudança deve introduzir esse motor como nova superfície de preview/print profissional, preservando os dados existentes e sem alterar o pipeline de geração documental.

## Goals / Non-Goals

**Goals:**

- Instalar `pagedjs` no app web e encapsular seu uso em componentes/hook React tipados.
- Renderizar conteúdo React/HTML vindo de Markdown ou TipTap em um container oculto de origem e paginar em uma superfície visível.
- Criar páginas A4 reais com preview estilo Word/Google Docs, sombra, espaçamento entre páginas e impressão limpa.
- Repetir cabeçalho, rodapé, numeração de páginas, watermark e timbre institucional em todas as páginas.
- Suportar conteúdo rico: tabelas, listas, imagens, títulos, assinaturas, blocos que não devem quebrar e documentos longos.
- Evitar duplicação de páginas, vazamento de memória e reprocessamento excessivo quando o conteúdo mudar.
- Manter o botão "Exportar PDF" usando `window.print()` no primeiro passo, aproveitando o preview paginado.

**Non-Goals:**

- Implementar exportação PDF server-side ou geração binária nativa nesta mudança.
- Alterar prompts, pipeline multiagente, schemas da geração documental ou conteúdo salvo.
- Recriar o editor TipTap ou suas ferramentas de edição.
- Garantir paridade pixel-perfect com Word em todos os navegadores.
- Substituir imediatamente todos os lugares que usam renderização Markdown simples; a adoção deve começar pelo preview concluído e pelo exemplo funcional.

## Decisions

1. **Encapsular Paged.js em `usePagedPreview`.**

   Criar um hook em `apps/web/src/modules/documents/ui/paged-preview/use-paged-preview.ts` responsável por receber refs de origem/destino, dependências de reprocessamento e opções de layout. O hook deve instanciar `Previewer`, limpar o destino antes de cada render, cancelar/ignorar renders obsoletos, limpar efeitos no unmount e expor estado (`idle`, `rendering`, `ready`, `error`) e metadados básicos.

   Alternativa considerada: chamar `new Previewer()` diretamente no componente de página. Isso funcionaria no protótipo, mas espalharia cleanup e controle de duplicação por vários componentes.

2. **Usar uma origem HTML oculta e uma saída paginada visível.**

   O componente `DocumentPreview` deve renderizar:

   - `#paged-root` oculto/fora da área visual, contendo `.page-content` com o documento fonte.
   - Um container visível para as páginas produzidas pelo Paged.js.

   Essa separação evita que o usuário veja conteúdo duplicado e permite que Paged.js leia um DOM estável sem depender da árvore final renderizada.

   Alternativa considerada: paginar o próprio nó visível. Isso aumenta o risco de mutação do DOM pelo Paged.js interferir no React.

3. **Criar componentes de composição, não lógica em CSS solto.**

   A estrutura proposta:

   - `DocumentPreview.tsx`: orquestra fonte oculta, saída paginada, estados e ação "Exportar PDF".
   - `PaperLayout.tsx`: define shell do documento, variáveis de layout e slots institucionais.
   - `PageHeader.tsx`: cabeçalho institucional reutilizável.
   - `PageFooter.tsx`: rodapé institucional reutilizável com dados, numeração e fallback.
   - `DocumentWatermark.tsx`: watermark opcional.
   - `usePagedPreview.ts`: ciclo de vida Paged.js.
   - `paged-preview.css`: regras `@page`, screen preview, print e conteúdo rico.
   - `DocumentPreviewExample.tsx`: exemplo funcional com logo, múltiplas páginas mockadas, tabelas, listas e assinatura.

   Alternativa considerada: um único componente grande. Isso acelera o primeiro commit, mas dificulta manter timbre, print, exemplo e integração com TipTap.

4. **Usar Paged Media para repetição institucional.**

   O CSS deve usar `@page { size: A4; margin: 20mm; }`, contadores de página e margin boxes quando suportados. Cabeçalho/rodapé podem ser definidos por elementos nomeados e/ou por strings CSS geradas a partir do layout, mas o contrato público dos componentes deve continuar React: `PageHeader`, `PageFooter`, watermark e children.

   Alternativa considerada: repetir cabeçalho/rodapé manualmente em cada página após o render. Isso aumenta o acoplamento com o DOM gerado por Paged.js e tende a quebrar em rerenderizações.

5. **Integrar com o preview existente sem quebrar fallback.**

   A primeira integração deve ser no preview de documento concluído quando houver conteúdo HTML/TipTap renderizável. Estados de loading, geração ao vivo, erro, vazio, seleção/ajuste textual e ações existentes continuam fora do conteúdo paginado. Markdown legado pode continuar usando a renderização atual até ganhar conversão segura para HTML do novo preview.

   Alternativa considerada: substituir imediatamente todo preview por Paged.js. Isso aumenta o risco durante uma área que o usuário está ajustando visualmente agora.

6. **Manter `window.print()` como exportação PDF inicial.**

   O botão "Exportar PDF" deve chamar `window.print()` com CSS de impressão limpo. O destino "Save as PDF" do navegador passa a ser o caminho inicial. Uma exportação PDF real por backend ou Playwright pode ser proposta depois, sem bloquear o preview profissional.

## Risks / Trade-offs

- **Paged.js muta o DOM de saída e pode duplicar páginas em rerenders** -> limpar o container de destino antes de cada render, versionar renders e ignorar promessas antigas.
- **React pode desmontar refs enquanto Paged.js ainda está renderizando** -> usar flag de cancelamento no hook e cleanup no retorno do `useEffect`.
- **Documentos longos podem renderizar devagar** -> debounce por `requestAnimationFrame`/timeout curto, não reprocessar se a assinatura do conteúdo não mudou, exibir estado de renderização discreto.
- **CSS de margin boxes varia entre navegadores** -> usar Paged.js como camada principal e manter fallback visual razoável dentro das páginas geradas.
- **Tabelas e imagens podem ultrapassar a área útil** -> aplicar estilos de quebra, largura máxima, repetição de cabeçalho de tabela e evitar quebra dentro de blocos críticos quando possível.
- **Conteúdo TipTap pode conter estruturas difíceis** -> converter para HTML controlado pelos componentes existentes/TipTap renderer, sem executar HTML bruto inseguro.
- **Impressão ainda depende do diálogo do navegador** -> documentar que "Exportar PDF" usa Save as PDF do browser nesta fase e validar Chrome como alvo principal.

## Migration Plan

1. Adicionar a dependência `pagedjs` no workspace web e, se necessário, tipos locais para o módulo.
2. Criar a pasta `apps/web/src/modules/documents/ui/paged-preview/` com hook, componentes, exemplo e CSS.
3. Implementar o exemplo funcional isolado para validar múltiplas páginas, cabeçalho, rodapé, watermark, tabelas, listas e assinatura.
4. Integrar o novo `DocumentPreview` ao preview concluído por trás de uma escolha de fonte segura, preservando o fallback atual.
5. Ajustar os estilos globais de print para que o app chrome não seja impresso e as páginas Paged.js saiam limpas.
6. Atualizar testes de componente para estados do hook, cleanup, rerender sem duplicação e presença dos slots institucionais.
7. Validar manualmente no navegador com `Background graphics`, documentos longos, timbre, tabelas e Save as PDF.
8. Rollback: manter o preview atual como fallback e remover o uso do componente Paged.js se houver regressão séria, sem migração de dados.

## Open Questions

- O primeiro rollout deve ficar atrás de feature flag ou já substituir o preview concluído com fallback automático?
- A fonte principal do preview paginado deve ser HTML derivado do TipTap JSON, Markdown renderizado, ou ambos desde o primeiro commit?
- O cabeçalho/rodapé institucional deve usar apenas o timbre completo da organização ou também slots textuais configuráveis por documento?

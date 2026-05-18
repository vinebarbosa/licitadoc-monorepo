## Context

O preview oficial em `/app/documento/:documentId/preview` ainda carrega a historia da renderizacao manual: componentes de folha, renderizadores TipTap/Markdown, CSS proprio de impressao e ajustes de margem dependentes do navegador. O laboratorio com Paged.js estabilizou a parte que estava mais sensivel: A4 real, quebra automatica, timbre oficial como fundo de pagina inteira e exportacao via dialogo de impressao.

Esta mudanca leva essa base para a pagina oficial. O objetivo nao e alterar geracao documental, conteudo salvo, agentes ou templates. A troca e da superficie de visualizacao/impressao: o documento concluido passa a ser renderizado por Paged.js, enquanto estados operacionais existentes continuam sob responsabilidade da pagina atual.

## Goals / Non-Goals

**Goals:**

- Substituir o preview principal de documentos concluidos pela renderizacao Paged.js.
- Reaproveitar o modulo ja validado no laboratorio, incluindo `DocumentPreview`, `PaperLayout`, `usePagedPreview` e CSS paged media.
- Usar `draftContentJson` como fonte preferencial quando disponivel, mantendo fallback seguro para `draftContent`.
- Aplicar `document.letterhead.url` como fundo A4 completo em todas as paginas, sem depender da margem escolhida no dialogo do navegador.
- Preservar loading, generating, failed, empty, retry, back navigation e acoes existentes do preview oficial.
- Fazer imprimir/exportar PDF usarem somente a saida paginada, sem app shell, toolbar, sombras ou conteudo duplicado.
- Manter a rota demo/laboratorio enquanto a pagina oficial e validada.

**Non-Goals:**

- Alterar pipeline de geracao, prompts, OpenAPI, schemas de documento ou formato salvo no banco.
- Implementar PDF server-side nesta etapa.
- Remover o fallback legado enquanto ainda houver documento sem fonte segura para Paged.js.
- Trocar o editor TipTap ou sua estrutura interna.
- Fazer paridade pixel-perfect com Word em todos os navegadores.

## Decisions

1. **Integrar Paged.js no preview oficial somente para documento concluido e renderizavel.**

   A pagina oficial deve continuar decidindo os estados de negocio. Quando o documento estiver concluido e possuir fonte renderizavel, o corpo e entregue ao renderer Paged.js. Quando estiver gerando, falhar, carregar ou estiver vazio, os estados existentes continuam iguais.

   Alternativa considerada: substituir toda a pagina por um componente novo. Isso aumentaria risco e apagaria comportamentos que ja funcionam, como retry e navegacao.

2. **Usar `draftContentJson` como fonte principal e `draftContent` como fallback.**

   O JSON do TipTap preserva estrutura rica e evita perda de tabelas/listas. Para documentos legados, `draftContent` continua sendo aceito por um caminho seguro de renderizacao Markdown/HTML controlado.

   Alternativa considerada: converter sempre a partir de Markdown. Isso simplifica o primeiro commit, mas perde fidelidade em documentos ricos.

3. **Tratar o timbre como fundo da pagina Paged.js, nao como imagem no fluxo do texto.**

   O timbre da organizacao deve entrar como `background-image` da pagina gerada, ocupando o A4 inteiro. O texto usa a area util definida pelo CSS paged media. Isso evita os problemas ja observados de logo atravessando texto, rodape duplicado e imagem cortada.

   Alternativa considerada: inserir `<img>` absoluto por pagina. Funciona no prototipo visual, mas duplica camadas com facilidade e interfere no fluxo de pagina.

4. **Isolar a impressao na saida Paged.js.**

   Acoes de imprimir/exportar chamam `window.print()`, mas o CSS de `print` deve esconder app chrome, botoes, containers fonte e decoracoes de tela. Apenas paginas geradas pelo Paged.js devem aparecer no PDF.

   Alternativa considerada: gerar PDF no backend agora. Isso pode ser proposto depois, mas nao deve bloquear a substituicao do preview.

5. **Manter a demo como ferramenta de regressao visual.**

   A rota de laboratorio continua existindo para validar timbre, margens e comportamento de Paged.js sem depender de um documento real especifico.

   Alternativa considerada: apagar a demo apos integrar. Como a area ainda esta sensivel visualmente, manter um laboratorio reduz custo de debug.

## Risks / Trade-offs

- **Paged.js duplicar paginas em rerender** -> limpar o container de destino antes de cada render, versionar execucoes e ignorar renders obsoletos.
- **Fonte oculta aparecer no PDF** -> marcar fonte e chrome como screen-only/print-hidden e validar impressao.
- **Timbre nao carregar por cache, CORS ou URL relativa** -> usar a URL entregue pela API do documento/organizacao e manter fallback sem imagem quebrada.
- **Conteudo rico quebrar tabelas ou blocos importantes** -> aplicar regras de quebra para tabelas, assinaturas, listas, imagens e secoes.
- **Documentos grandes ficarem pesados** -> rerenderizar apenas quando conteudo, timbre ou opcoes de layout mudarem.
- **Dialogo de impressao do navegador variar** -> controlar tamanho e area util com CSS `@page`; validar no Chrome com `Background graphics` habilitado.

## Migration Plan

1. Revisar o preview oficial atual e separar estados da renderizacao do documento concluido.
2. Preparar o modulo `paged-preview` para receber conteudo real, titulo, metadados e URL de timbre da pagina oficial.
3. Criar a conversao de `draftContentJson`/`draftContent` para uma arvore HTML/React segura para Paged.js.
4. Substituir o corpo concluido de `/app/documento/:documentId/preview` pelo renderer Paged.js.
5. Remover ou isolar CSS antigo de folha/impressao que conflite com Paged.js.
6. Garantir que imprimir/exportar PDF use a saida paginada e que app shell nao apareca no PDF.
7. Validar documentos com e sem timbre, JSON TipTap, Markdown legado, multiplas paginas, listas e tabelas.
8. Rollback: manter o renderer antigo como fallback acionavel se a fonte nao puder ser paginada com seguranca.

## Open Questions

- O renderer antigo deve ficar acessivel por feature flag temporaria ou apenas como fallback automatico?
- A pagina oficial deve mostrar algum estado discreto de "paginando" quando o documento e muito longo?

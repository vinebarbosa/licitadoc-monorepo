## Context

O preview de documentos já possui APIs para sugerir e aplicar ajustes em texto selecionado: `POST /api/documents/:documentId/adjustments/suggestions` resolve o trecho e retorna uma substituição, e `POST /api/documents/:documentId/adjustments/apply` persiste a troca no `draftContent`. No frontend, o usuário consegue selecionar texto no preview e abrir um painel de ajuste, mas a seleção ainda não recebe um estado visual de processamento dentro do documento e o fluxo precisa garantir que a aplicação atualize o preview com o conteúdo salvo.

Há uma dificuldade central: o usuário seleciona texto renderizado em HTML, enquanto o documento persistido é Markdown. O backend já tem lógica para resolver seleção exata, contexto e fallback markdown-aware; a implementação deve preservar essa proteção, expondo no frontend um estado visual que acompanha o mesmo alvo usado pelo backend.

## Goals / Non-Goals

**Goals:**

- Mostrar um skeleton cinza exatamente no trecho selecionado enquanto a sugestão está sendo gerada e enquanto a aplicação está pendente.
- Aplicar a sugestão no `draftContent` persistido, atualizar o cache/preview e limpar o estado de seleção após sucesso.
- Preservar validações de segurança: documento precisa estar concluído, seleção precisa resolver para um alvo único, hash precisa bater e o trecho fonte precisa continuar igual na aplicação.
- Tornar erros compreensíveis quando a seleção for ambígua, não resolvível, obsoleta ou quando o provedor falhar.
- Cobrir o comportamento com testes de API e frontend.

**Non-Goals:**

- Criar histórico/versionamento de ajustes.
- Permitir múltiplos ajustes simultâneos no mesmo documento.
- Alterar o modelo de dados ou adicionar tabela de auditoria.
- Transformar o painel em editor rich-text completo.
- Aplicar ajustes automaticamente sem confirmação do usuário, salvo se uma decisão posterior de produto pedir explicitamente.

## Decisions

### Decision: Track a single active adjustment target in the preview

The frontend should keep one active text adjustment state containing the selected rendered text, local selection context, and the latest suggestion target returned by the API. While suggestion or apply is pending, the document renderer receives this state and overlays/replaces the selected rendered fragment with an inline gray skeleton.

Alternative considered: show loading only in the floating panel. That is simpler, but it does not answer the product need: the user should see which exact part of the document is being adjusted.

### Decision: Render skeleton by matching the active selected text in the preview content

The preview can render the persisted Markdown through existing `DocumentMarkdownPreview`, but the document sheet should be able to decorate the currently selected text range in the rendered output. Implementation can use a small selection-highlighting layer/helper that finds the selected rendered text in text nodes under the document sheet and wraps/replaces it with a skeleton span while pending. This keeps the backend as the source of truth for persistence while making the visible document reactive.

Alternative considered: mutate the Markdown string client-side with placeholder syntax before rendering. That risks breaking Markdown structure and drifting from the backend's source-target resolution.

### Decision: Backend remains authoritative for source replacement

The client must send `sourceContentHash`, `sourceTarget`, and `replacementText` from the suggestion response when applying. The backend must reject stale hashes or mismatched source text and return the updated serialized document on success. The frontend should use that response to update the document cache and preview rather than applying a local optimistic replacement that could diverge from persisted content.

Alternative considered: apply an optimistic client-side replacement first. That would make the UI feel faster, but it increases conflict risk and makes failure recovery harder. A skeleton is enough feedback while the authoritative update completes.

### Decision: Keep selection failure explicit

When the backend cannot resolve a selected rendered excerpt unambiguously, the API should return a user-actionable error message and the frontend should clear pending skeleton state. The user can then select a larger or more specific passage.

Alternative considered: guess the first match. This would be dangerous in legal/administrative documents because repeated phrases are common and replacing the wrong occurrence would be worse than asking for a clearer selection.

## Risks / Trade-offs

- [Risk] Rendered HTML text may differ from Markdown source enough that a skeleton cannot locate the exact rendered text. -> Mitigation: use bounded selection context in the request and keep the panel error path explicit; only show the skeleton while the frontend can identify the rendered fragment.
- [Risk] Markdown components with nested nodes may split selected text across multiple text nodes. -> Mitigation: implement and test text-node range decoration across adjacent nodes, including paragraphs and list-field selections.
- [Risk] Long selections can make the skeleton visually large or shift layout. -> Mitigation: use skeleton blocks/inline spans that preserve approximate dimensions and line height.
- [Risk] Document content may change between suggestion and apply. -> Mitigation: keep the existing content hash/source text checks and surface conflict messaging in the panel.

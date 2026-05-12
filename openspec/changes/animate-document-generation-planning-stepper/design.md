## Context

The current planning panel is compact and avoids raw reasoning, but it uses a small static set of phases. During long document generation, this can still feel like a passive loading indicator rather than a live process.

The frontend already receives planning and document content stream state. This change should use that existing state to drive a richer visual timeline without changing the provider, worker, SSE route, or event contract.

## Goals / Non-Goals

**Goals:**

- Turn the planning panel into a vertical timeline/stepper with a fixed-height scroll area.
- Show a richer set of document-generation stages that are meaningful to a procurement document user.
- Animate the active step and completed states subtly so the process feels alive.
- Automatically scroll the active step through the card as progress advances.
- Keep the card compact, restrained, and aligned with the validated document preview layout.
- Respect reduced-motion preferences and keep the experience understandable without animation.

**Non-Goals:**

- Add raw reasoning visibility or a detailed reasoning control.
- Persist planning data or include planning in exports/print.
- Add backend milestones, new SSE event types, or provider contract changes.
- Redesign the document sheet or the generated document typewriter behavior.
- Claim that the UI is exposing exact internal model reasoning.

## Decisions

1. Use a synthetic frontend stepper.

   The current backend stream does not provide semantic milestone events. The stepper should derive a product-facing progress index from existing signals such as planning content length, whether document content has started, and completion/failure state. This gives the user a useful sense of motion now while preserving the backend contract.

2. Use more stages, but keep them operational and truthful.

   The step list should describe observable generation work, not private reasoning. A target set is:
   - Recebendo contexto do processo
   - Identificando tipo e finalidade do documento
   - Lendo dados principais da solicitação
   - Mapeando objeto, justificativa e escopo
   - Organizando seções obrigatórias
   - Preparando fundamentação e critérios
   - Redigindo conteúdo técnico
   - Conferindo consistência do texto
   - Formatando preview do documento
   - Finalizando geração

3. Keep the timeline compact and vertically scrollable.

   The card should have a bounded stepper viewport so it does not push the document preview down indefinitely. As the active step changes, the component should scroll the active item into view with smooth behavior when motion is allowed.

4. Animate state, not decoration.

   Completed items can use a check state, the active item can use a subtle pulse/highlight, and pending items can remain quiet. Avoid decorative heavy motion; the animation should clarify progress.

5. Make motion optional.

   Respect `prefers-reduced-motion` by disabling smooth scrolling and pulse-like animation while preserving the same visible information and state changes.

6. Preserve existing live preview behavior.

   Final generated document chunks continue to render in the document sheet as before. The stepper stays outside the document body and remains transient.

## Risks / Trade-offs

- Synthetic steps can appear more precise than the underlying stream -> Use product-facing language and avoid implying exact model internals.
- Too many steps can feel busy -> Keep the viewport compact and use subdued pending states so only the active step draws attention.
- Auto-scroll can be distracting -> Use restrained movement and honor reduced-motion preferences.
- Tests may become brittle around animation timing -> Test state changes and scroll invocation behavior without relying on exact animation frames.

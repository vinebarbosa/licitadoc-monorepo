## Context

The process detail page already shows the main process summary, object, justification, and process documents. The API response for `GET /api/processes/:processId` includes `sourceMetadata`, which can contain SD extraction data under `extractedFields.items`.

The current UI does not surface these items, so users cannot review the solicitation contents from the process detail page. This is especially relevant for processes created from SD data or future native solicitation forms, where item rows are part of the process evidence.

## Goals / Non-Goals

**Goals:**

- Show solicitation items below `Justificativa` and before the process document cards.
- Reuse the existing process detail response instead of introducing a new endpoint.
- Normalize item metadata defensively in the web model layer so the UI can handle imported SD metadata and future native solicitation metadata.
- Keep long descriptions readable without hiding the item from the process overview.
- Allow future kit/component item structures to appear in the same section when present.

**Non-Goals:**

- Changing the document generation prompt or generated document contents.
- Creating the native solicitation expense form.
- Migrating existing process metadata.
- Adding item editing in the process detail page.

## Decisions

1. Derive items from `sourceMetadata` in the web layer.

   The backend already returns `sourceMetadata` in the process detail response. The first implementation should add a typed normalizer/helper in the web process model that reads `sourceMetadata.extractedFields.items`, validates each row defensively, and returns a UI-ready array.

   Alternative considered: add a normalized `items` property to the API response. That would make the client contract clearer, but it increases API surface area and generated-client churn for data that is already present in the current response.

2. Preserve fallback support for singular legacy metadata.

   If `extractedFields.items` is empty or absent, the helper should look for `extractedFields.item` and render it as a single item when it has usable content. This keeps older imports from losing visibility.

   Alternative considered: only support the current array shape. That is simpler, but it would make the UI less useful for existing or partially imported metadata.

3. Render items as an inline section inside the existing summary card.

   The section should appear immediately after the justification block, separated by the same visual rhythm already used in the summary card. It should not introduce nested decorative cards; a compact list or table with dividers is a better fit for the current detail page.

   Alternative considered: place items as a new card below the process summary. That makes the section easier to isolate, but it weakens the requested "visao completa" flow because items are part of the process summary evidence.

4. Treat long descriptions as first-class content.

   Long item descriptions should wrap cleanly and remain accessible. The UI may use a concise preview with an explicit expand action for very long text, but it must not truncate the only available description permanently.

   Alternative considered: always show the full description. That preserves all content, but large SD imports can dominate the page and push process documents too far down.

5. Support component rows opportunistically.

   If an item includes a `components` array with title/description/quantity/unit fields, the section should render those components beneath the parent item in a compact nested list. If no components exist, the regular item row remains unchanged.

   Alternative considered: wait for the native solicitation form before handling components. Adding read-only support now is low risk and keeps the display model compatible with the intended native format.

## Risks / Trade-offs

- `sourceMetadata` is loosely typed -> The normalizer must guard every field and ignore unusable rows instead of assuming API shape.
- Long imported descriptions can overwhelm the page -> Use compact layout, wrapping, and optional expand/collapse for lengthy descriptions.
- Currency/quantity formats may vary -> Reuse existing frontend formatting helpers/patterns where possible and fall back to raw labels when the value is not numeric.
- Component structures are not standardized yet -> Support common field names defensively, but avoid making component rendering required for all item metadata.

## Migration Plan

- No data migration is required.
- Deploying the web change should immediately show item metadata for processes that already contain `sourceMetadata.extractedFields.items`.
- Rollback is limited to reverting the web UI/model change; stored process metadata remains unchanged.

## Open Questions

- Should the final heading be `Itens da Solicitação`, `Itens da SD`, or `Itens do Processo`? The implementation should choose the label that best matches existing product language.
- If the future native solicitation form stores richer item titles and component descriptions, should those fields be normalized in the API later for stronger contract guarantees?

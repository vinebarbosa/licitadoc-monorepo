## Why

Na tela de detalhe do processo, o usuário já consegue revisar o objeto, a justificativa, os documentos e os metadados principais, mas ainda não vê os itens da solicitação no mesmo contexto. Isso deixa uma lacuna importante: para entender o processo completo, especialmente antes de gerar ou revisar documentos, o usuário precisa confirmar quais itens, quantidades e valores entraram na solicitação.

Hoje esses itens já podem estar disponíveis no `sourceMetadata.extractedFields.items` do processo, mas ficam invisíveis na tela. Exibi-los logo abaixo da justificativa deixa a revisão mais direta e reduz a chance de o usuário só perceber inconsistências quando abrir documentos gerados.

## What Changes

- Add a process detail item section immediately below `Justificativa` in the process summary card.
- Render item metadata from `sourceMetadata.extractedFields.items`, including description/title, quantity, unit, unit value and total value when available.
- Keep a defensive fallback for older or singular metadata shapes, such as `sourceMetadata.extractedFields.item`.
- Support long item descriptions without breaking the layout, keeping the page readable while preserving access to the full content.
- Support component/subitem display when future item metadata includes kit/component structures.
- Show an unobtrusive empty state only when there are no usable items in the process metadata.

## Capabilities

New Capabilities

- `web-process-detail-items`: display solicitation items on the process detail page below justification.

Modified Capabilities

- None.

## Impact

- Web process detail page UI and process detail model helpers.
- Web tests/fixtures for process details with multiple items, long descriptions, and missing item metadata.
- No database migration is expected.
- No API route change is expected because the existing process detail response already exposes `sourceMetadata`; implementation may refine OpenAPI examples/types only if needed.

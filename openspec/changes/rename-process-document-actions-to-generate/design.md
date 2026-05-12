## Context

The process detail page renders four document cards for DFD, ETP, TR, and Minuta. Pending cards currently show a primary `Criar` action that links to `/app/documento/novo?tipo=<type>&processo=<processId>`. Generated cards show `Editar` and `Visualizar`, but do not expose a clear generation action even though users may need to produce a fresh version.

This change is frontend-only unless implementation reveals that regeneration needs a backend contract. The existing create-document flow already represents document generation, so the UI can reuse the same route for both first generation and repeated generation.

## Goals / Non-Goals

**Goals:**
- Rename pending document-card action copy from `Criar` to `Gerar`.
- Add `Gerar novamente` on cards that already have a document id.
- Reuse the existing document creation route with process id and document type query parameters.
- Preserve existing `Editar` and `Visualizar` actions for generated documents.

**Non-Goals:**
- Add a new regeneration endpoint.
- Replace or delete existing generated documents.
- Change document status mapping or backend `availableActions`.
- Change the document creation page flow beyond receiving the same query parameters it already supports.

## Decisions

1. Treat generation as the primary action language.

   The UI should say `Gerar` for missing documents because the action triggers document generation, not generic CRUD creation. This better matches the product mental model and the underlying AI workflow.

2. Compute the generation link independently of `availableActions.create`.

   Pending cards can keep using the existing create link. Generated cards need `Gerar novamente` even when the backend marks `availableActions.create` as false, so the frontend should be able to build a generation link from process id and document type for any card where generation is allowed by the UI.

3. Keep edit and view actions unchanged.

   Existing generated-document actions remain useful. `Gerar novamente` is additive and should not remove `Editar` or `Visualizar`.

## Risks / Trade-offs

- Reusing `/app/documento/novo` for repeated generation may create a second document rather than overwrite the existing one -> This is acceptable for this label-only/navigation change unless product later defines true overwrite semantics.
- Showing too many actions on completed cards may crowd the UI -> Keep `Gerar novamente` as a primary generation action and retain current compact action layout.
- Backend action flags may not explicitly model regeneration -> Keep this behavior in the web layer and cover it with tests.

## Context

The documents listing renders each document name as the primary clickable element in the table. That link currently uses `getDocumentEditLink(doc)`, which resolves to `/app/documento/:documentId`. The router does not register that path. The working document-reading route is `/app/documento/:documentId/preview`, already exposed by `getDocumentPreviewLink(doc)` and used by the `Visualizar` dropdown action.

## Goals / Non-Goals

**Goals:**
- Make the document-name link open the document preview page.
- Keep the existing `Visualizar` dropdown action aligned with the same preview URL.
- Prevent the primary document-name link from pointing to `/app/documento/:documentId`.
- Add regression tests for the table name link.

**Non-Goals:**
- Build a document editing page.
- Change the `Editar` dropdown behavior.
- Add or remove routes.
- Change API or generated client behavior.

## Decisions

1. Use `previewLink` for the document name.

   The listing already calculates both `editLink` and `previewLink`. The document name should use `previewLink` because clicking a document name is the natural read/open action in this table, and the preview page is the existing document route. The alternative of adding a new edit route would expand scope and does not match the requested fix.

2. Leave the dropdown `Editar` action unchanged.

   The request targets the document name link. Changing edit behavior could affect a separate workflow and should be handled by a dedicated change if needed. Tests should focus on ensuring the name link no longer uses the missing route.

## Risks / Trade-offs

- Users may still find the `Editar` action if it points to an unavailable route -> Keep this change scoped to the reported click target and raise a separate change for edit behavior if needed.
- Multiple links with the same document name could make tests ambiguous -> Assert the specific table-name link target by accessible name and expected `href`.
- Existing tests may only assert that the link exists -> Strengthen them to assert the route.

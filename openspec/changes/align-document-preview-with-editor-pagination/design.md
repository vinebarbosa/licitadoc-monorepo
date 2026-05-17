## Context

The protected document editor now uses the validated `/demo/documento/editor` experience and saves TipTap JSON through `draftContentJson`. The completed preview route still renders `draftContent` through the Markdown preview pipeline, so edits that are structurally valid in TipTap can look different after save, especially for paragraph indentation, lists, alignment, spacing, inline marks, and page-break separators.

The preview also has important behavior that must remain intact: loading/error/empty states, live generation rendering, text-adjustment selection, printing, and export actions. The change should make completed saved documents render from the same structural source as the editor without destabilizing generation-time streaming or legacy documents.

## Goals / Non-Goals

**Goals:**

- Render completed previews from saved TipTap JSON when available.
- Share the validated document surface between editor and preview so typography, sheet width, margins, paragraph indentation, list indentation, alignment, and page-break gaps match.
- Persist and render page breaks in both the editor and preview as subtle sheet gaps, without explicit "Quebra de pagina" labels.
- Keep compatibility for legacy/generated documents that only have textual `draftContent`.
- Preserve existing preview states, print behavior, and text-adjustment affordances.

**Non-Goals:**

- Rebuilding the editor UI or changing the validated interaction model.
- Implementing full browser-grade automatic pagination, page measurement, or DOCX/PDF export fidelity beyond the current preview surface.
- Removing the compatibility text content used by legacy preview/export flows.
- Changing the AI text-adjustment API semantics in this proposal.

## Decisions

1. **Use TipTap JSON as the canonical saved preview source for completed documents.**

   Completed previews should prefer `draftContentJson` and only fall back to `draftContent` when JSON is absent. This avoids lossy JSON -> Markdown -> React rendering conversion after the user saves from the editor. Alternative considered: continue generating compatibility Markdown from JSON and improve Markdown styling. That still loses TipTap-specific attributes such as paragraph indentation and alignment, so it does not satisfy visual parity.

2. **Introduce a shared document renderer/surface for edit and read-only modes.**

   Extract the document sheet, typography tokens, page-gap styling, and TipTap extension set into reusable document rendering modules. The editor can mount the shared renderer in editable mode; the preview can mount it in read-only mode. Alternative considered: duplicate CSS and renderer behavior in the preview. That would be faster initially but would reintroduce drift whenever the editor UI changes.

3. **Represent manual page breaks in TipTap JSON using a stable node already understood by the editor or an explicit page-break node.**

   The demo currently uses `horizontalRule` as a page-break visual. Implementation can either keep `horizontalRule` as the persisted compatibility representation and style it as a page gap, or introduce a dedicated `pageBreak` node with migration from existing `horizontalRule` breaks. The selected implementation must keep save/reload/preview round trips stable and should avoid visible labels. Alternative considered: derive page gaps only from content height. That is too fragile for a first step because users need explicit page breaks to survive save and preview.

4. **Keep live generation Markdown rendering separate until completed JSON exists.**

   During generation, the system streams text content. The live preview can keep using the existing Markdown path until the completed document detail exposes JSON. Completed documents then switch to the shared TipTap renderer. Alternative considered: convert streamed text to TipTap JSON on every chunk. That increases complexity and latency for a flow that is not the reported mismatch.

5. **Text-adjustment selection must work against the rendered completed document.**

   The preview's text-selection overlay currently reads DOM text from the Markdown renderer. The read-only TipTap preview should keep a document body ref and selection extraction so the existing suggestion panel can continue to target selected text. For now, replacement application can keep using the API's text/hash contract unless a later change moves adjustments fully to JSON ranges.

## Risks / Trade-offs

- **Legacy documents may not have JSON** -> Keep fallback derivation from `draftContent` and render the fallback with the existing Markdown path or derived TipTap JSON.
- **`horizontalRule` may be semantically broader than page break** -> Scope the document editor renderer so horizontal rules inside generated procurement documents visually mean page break, or add a dedicated node with migration if that becomes ambiguous.
- **Shared renderer can affect both editor and preview at once** -> Add focused regression tests and verify `/demo/documento/editor`, `/app/documento/:id`, and `/app/documento/:id/preview`.
- **Print layout can diverge from screen page gaps** -> Preserve current print CSS and ensure page-break nodes map to print `break-after: page` while screen rendering shows the validated gap.
- **Text adjustment against JSON-rendered preview may still use text matching** -> Keep the existing text context contract for this change and test that selecting visible text still opens the adjustment panel.

## Migration Plan

1. Update document detail mapping/client usage so completed preview can read `draftContentJson`.
2. Add or extract the shared TipTap document renderer and page-surface styles.
3. Render completed preview from JSON when available; keep legacy textual fallback.
4. Normalize page-break rendering in both editor and preview, including print behavior.
5. Add unit and page tests covering JSON preview parity, page breaks, legacy fallback, and save-then-preview navigation.
6. Roll back by returning completed preview to the existing Markdown renderer if a release issue appears; stored JSON remains non-destructive and compatible with the editor.

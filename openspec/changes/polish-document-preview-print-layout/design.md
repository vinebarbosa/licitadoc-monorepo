## Context

The current document preview is implemented in `DocumentPreviewPageUI` with a `DocumentSheet` that uses shared app `Card` styling for the document body. That sheet injects a fixed header, hardcoded missing-organization placeholders, an `OBJETO` section based on `document.name`, a left border around the Markdown body, and an extra footer/signature block.

This creates a visual mismatch with the validated generated content. The generated Markdown already contains the formal document title, sections, object text, closing language, and signature context. The preview layer should present that content like a formal document and support printing, not add synthetic document clauses of its own.

## Goals / Non-Goals

**Goals:**

- Render generated documents inside a polished A4-like sheet on screen.
- Make the sheet feel like the actual document, not a generic application card.
- Remove misleading placeholders and duplicated UI-generated document content.
- Improve formal-document Markdown typography without changing generation recipes.
- Add print CSS so browser printing produces a clean document page.
- Preserve completed-document preview and live-generation preview behavior.

**Non-Goals:**

- Generate PDF or DOCX files in this change.
- Modify DFD, ETP, TR, or minuta recipes.
- Change backend document APIs or text-generation streaming behavior.
- Add organization/department metadata to document responses.
- Rework the global app shell, navigation, or sidebar.

## Decisions

1. **Use generated Markdown as the document content source**

   The preview sheet will stop injecting formal content that can be mistaken for part of the document when the generated Markdown already owns that structure. This includes removing the hardcoded missing organization/unit labels, the artificial `OBJETO` block backed by `document.name`, and the extra UI signature footer.

   Alternative considered: keep the UI header and strip the first Markdown heading. That would require brittle content parsing and could break document types whose title structure varies. Letting Markdown remain the document body keeps the rendering layer simpler and more faithful.

2. **Create a document-specific sheet instead of using a generic card**

   The preview will use a semantic document wrapper with explicit document-page styling rather than relying on shared `Card` visuals. On screen it should have a white page surface, restrained border/shadow, formal padding, and responsive scaling. In print, the same wrapper should lose screen-only decoration.

   Alternative considered: restyle the existing `Card`. That keeps the implementation smaller, but it couples formal document layout to a reusable app primitive that is meant for interface panels, not printable pages.

3. **Move formal typography into the Markdown preview layer**

   `DocumentMarkdownPreview` will remain responsible for safe Markdown rendering, but its document-facing classes should better match official documents: centered primary headings when appropriate, clearer section spacing, readable justified paragraphs, stronger table borders, and print-aware break behavior.

   Alternative considered: post-process Markdown into a richer document AST. That is unnecessary for the current scope because the existing `react-markdown` + `remark-gfm` pipeline already covers the needed elements and preserves unsafe HTML protection.

4. **Implement print behavior with scoped CSS selectors**

   Print styles should live in the app stylesheet and target explicit preview/document selectors or classes. The print view should hide app chrome and preview actions, reset background/shadows, set page margins, and avoid common awkward breaks around headings and tables.

   Alternative considered: open a separate print-only route. That would increase routing and data-fetch complexity before the product has real PDF/DOCX export flows.

5. **Keep live generation visually consistent**

   Generating documents with partial streamed content should use the same document sheet and Markdown typography as completed documents. The existing live-writing auto-follow behavior should remain attached to the document body endpoint after the rendered content.

   Alternative considered: keep a separate generation-only preview card. That would make the transition from generating to completed feel inconsistent and preserve part of the current visual problem.

## Risks / Trade-offs

- **Generated content may omit formal metadata that the UI previously faked** -> The preview will prefer omission over misleading placeholders. Future API metadata can be added later and displayed only when real.
- **Printing from a SPA can still include browser-specific margins and headers** -> Scoped print CSS can make the document clean, while browser print settings remain outside app control.
- **A4-like width can feel narrow on large screens** -> Keep the page centered and allow the surrounding preview area to provide comfortable breathing room.
- **Removing the synthetic footer changes existing tests and visible text** -> Update tests to assert the new contract: no placeholder metadata, no artificial object section, and Markdown content remains semantic.
- **Tables can still be wider than the page** -> Keep responsive overflow on screen and apply print-friendly wrapping/borders to reduce clipping where possible.

## Context

The previous closing block change removed visible `FECHO` headings and introduced the desired visual contract: local/date on the right, signature line plus responsible name and role centered. In practice, the provider interpreted that visual instruction by emitting HTML such as `<div align="right">...</div>` and `<div align="center">...</div>`.

The preview intentionally treats generated content as text/Markdown instead of executing raw HTML. That is the safer behavior, but it means provider-produced layout tags appear literally in the document. The current Markdown-to-Tiptap conversion already has a signature-closing heuristic based on the underscore signature line, so the system has a natural place to apply presentation without asking the provider to generate markup.

## Goals / Non-Goals

**Goals:**

- Ensure DFD, ETP, and TR closing/signature blocks are generated as clean plain Markdown.
- Prevent literal HTML alignment tags from appearing in stored generated content, document detail responses, or previews for newly generated drafts.
- Preserve the visual result requested by the user: no closing heading, local/date right-aligned, signature line/name/role centered.
- Keep raw HTML disabled in document preview and avoid creating an XSS or content injection dependency.
- Make the fix tolerant of provider drift by normalizing known bad closing-block markup before Tiptap conversion.

**Non-Goals:**

- Do not introduce raw HTML rendering in Markdown preview.
- Do not create a general-purpose HTML-to-document importer.
- Do not redesign document pagination, print layout, or the whole document editor.
- Do not change the legal/editorial structure of DFD, ETP, TR, or Minuta beyond the closing/signature formatting contract.
- Do not repair every historical document in the database unless a narrow affected-document repair is explicitly chosen during implementation.

## Decisions

1. Keep generated document content semantic and plain.

   Recipe instructions should stop using ambiguous phrasing such as "alinhável à direita" when addressing the provider. The provider-facing instruction should say that the model must emit only plain Markdown text lines and must not use HTML, `align`, CSS, tables, comments, code fences, or renderer directives to force visual layout. The application, not the model, owns visual alignment.

   Alternatives considered:

   - Allow provider-generated HTML and render it with raw HTML support. Rejected because it weakens preview safety and leaves layout dependent on provider behavior.
   - Ask the provider to use different Markdown tricks for alignment. Rejected because Markdown has no portable right/center alignment primitive and tricks would remain brittle.

2. Normalize known bad closing markup before storage and JSON conversion.

   `sanitizeGeneratedDocumentDraft` is already the central cleanup point after provider output and before persistence. It should normalize generated DFD/ETP/TR text by converting closing-block wrappers such as `<div align="right">Pureza/RN, 30 de abril de 2026.</div>` and `<div align="center">MARIA...</div>` into plain text lines. The same pass should remove equivalent harmless wrappers if they only exist to align the local/date, signature line, responsible name, or role.

   This normalization should be narrow. It should not attempt to preserve arbitrary HTML, parse untrusted documents as HTML, or support general inline layout. The intended behavior is "strip the layout wrapper, keep the administrative text".

   Alternatives considered:

   - Strip every angle-bracket fragment everywhere in every document. Rejected because it may delete legitimate textual references and is too broad.
   - Fix only the prompt and trust future generations. Rejected because provider drift can recur, and tests should exercise the backend contract.

3. Use Tiptap JSON attributes for the final visual alignment.

   `documentTextToTiptapJson` should continue to detect the canonical signature line and apply paragraph attributes for the surrounding closing block. After normalization, the local/date paragraph can receive `textAlign: "right"` and the signature line/name/role paragraphs can receive `textAlign: "center"` without literal alignment markup in the text.

   If implementation discovers that page splitting still separates the role from the signature line in ordinary final-page conditions, add the smallest preview/editor styling hook needed to keep the closing block compact. This should be based on rendered paragraph attributes or a dedicated safe node attribute, not on raw HTML embedded in generated content.

4. Add regression tests at the provider-output boundary.

   The most valuable tests are backend tests that simulate a provider response containing the exact bad strings shown in the screenshot. Those tests should assert that persisted `draftContent` no longer contains `<div`, `</div>`, or `align=`, while `draftContentJson` still contains the expected paragraph alignment attributes. Recipe tests should also assert that DFD/ETP/TR instructions forbid HTML/layout markup for closing blocks.

## Risks / Trade-offs

- Provider emits a different HTML shape → mitigate with narrow support for common closing wrappers and recipe wording that removes incentive to emit markup.
- Normalizer removes meaningful text by overmatching → mitigate by restricting cleanup to simple wrapper tags and preserving inner text.
- Existing completed documents still contain literal tags → mitigate by optionally re-saving/regenerating affected documents or adding a read-time cleanup for fallback preview generation if this proves necessary.
- Pagination still splits the role to a new page → mitigate with a small keep-together styling rule only for the detected signature closing block, after the content is clean.
- Tests become too coupled to one name/date fixture → mitigate by asserting structural cleanup and alignment attrs, not a single hard-coded municipality or responsible name.

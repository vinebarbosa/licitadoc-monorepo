## Context

The current DFD, ETP, and TR recipe templates end with a visible Markdown heading named `FECHO`, followed by three plain paragraphs: local/date, responsible name, and responsible role. The web preview also has CSS that treats headings containing `fecho` or `assinatura` as signature markers, so the current visual behavior depends on the exact heading the user wants removed.

Generated documents are persisted as Markdown text and as Tiptap JSON. The preview prefers the JSON representation when available, while the Markdown renderer intentionally does not enable raw HTML. That means alignment cannot be solved safely by asking the model to emit inline HTML or style attributes in the generated Markdown.

## Goals / Non-Goals

**Goals:**

- Remove the visible `FECHO` heading from generated DFD, ETP, and TR closing blocks.
- Keep the closing block deterministic across templates: local/date, signature line, responsible name, responsible role.
- Render local/date right-aligned in the persisted previewable document structure.
- Render the signature line, responsible name, and role centered.
- Preserve safe Markdown/JSON handling without enabling raw HTML in document previews.
- Update regression tests so the new block is protected by both recipe and generation/preview coverage.

**Non-Goals:**

- Change the minuta contract template.
- Add DOCX/PDF export behavior.
- Add a database migration or change public document API fields.
- Rework the full document editor model beyond the attributes needed for this closing block.

## Decisions

### Decision: Make the templates emit an untitled canonical closing block

DFD, ETP, and TR templates should end with the placeholders directly, without `## FECHO` or another visible closing heading. The canonical order should be:

1. `{{organization.city}}/{{organization.state}}, {{process.issuedAt_long_br}}.`
2. a signature line, for example `________________________________________`
3. `{{process.responsibleName}}`
4. `{{department.responsibleRole_or_sourceResponsibleRole_or_fallback}}`

The instructions should also tell the provider not to introduce a `FECHO`, `ASSINATURA`, or equivalent heading in the final output.

Alternative considered: keep the heading but hide it with CSS. That would satisfy the screenshot superficially, but the generated content would still contain a fake section title and copy/export flows could still expose it.

### Decision: Preserve alignment through Tiptap JSON attributes

The backend Markdown-to-Tiptap conversion should recognize the canonical closing block and assign paragraph alignment attributes: right alignment for local/date, center alignment for the signature line, responsible name, and role. It should also avoid first-line indentation for those paragraphs. Existing Tiptap `TextAlign` support can render those attributes in the preview and editor without adding new dependencies.

Alternative considered: emit raw HTML from the model. That conflicts with the safe preview design, because raw HTML is intentionally not enabled in Markdown preview and would be treated as untrusted content.

### Decision: Keep the signature line as content, not decoration

The signature line should be represented as a real line in the document content so it survives print, preview, edit, copy, and fallback text flows. Styling can control centering and spacing, but the line itself should not depend on a pseudo-element tied to a removed heading.

Alternative considered: render the line entirely in CSS. That is visually clean, but it makes the signature affordance disappear from plain text and increases coupling between renderer heuristics and generated content.

### Decision: Retire heading-based signature detection for the new path

Preview styles and tests should stop relying on `FECHO`/`ASSINATURA` headings as the only signature marker. Legacy Markdown fallback can remain safe, but generated documents should follow the new JSON-backed structure.

Alternative considered: broaden Markdown heading detection to hide several labels. That keeps the brittle label dependency and does not solve the requirement that the document should not have a closing title.

## Risks / Trade-offs

- [Risk] Generated providers may still output `## FECHO` despite the template. -> Mitigation: add explicit instruction constraints and sanitization/test coverage that rejects or removes the heading for DFD, ETP, and TR.
- [Risk] Alignment could be lost when Markdown text is the only available representation. -> Mitigation: generation should persist Tiptap JSON immediately, and detail reads already prefer JSON when available.
- [Risk] Existing tests expect `## FECHO`. -> Mitigation: update recipe, generation, and preview assertions to check absence of the heading and presence of the formatted signature block.
- [Risk] The underscore signature line may wrap on narrow screens. -> Mitigation: use a line length that fits the document page width and center it with no first-line indentation.

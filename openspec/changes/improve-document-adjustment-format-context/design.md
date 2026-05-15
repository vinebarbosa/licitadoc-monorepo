## Context

The document adjustment flow receives text selected from the browser-rendered preview, but the persisted document is Markdown. The selected text can differ from the source because of Markdown markers, heading/list formatting, browser line wrapping, hyphenation, uppercase visual treatment, and selection context that spans section boundaries. Today those differences can produce a 409 conflict even when the user selected a valid passage, or the AI can return a replacement that collapses a heading and paragraph into one malformed block.

The backend already has a source-target model and content-hash protection. This change keeps that authoritative replacement model, but makes the target resolver and AI prompt understand document structure before the provider is called and before a replacement is persisted.

## Goals / Non-Goals

**Goals:**

- Resolve common valid selections from rendered preview text to a unique Markdown source target without requiring the user to manually reselect a larger passage.
- Preserve section boundaries and Markdown block structure when prompting the AI and applying the replacement.
- Support instructions like "isso aqui tem que ser um parágrafo" for a selected section body without accidentally rewriting the heading or turning the whole section into a title.
- Return more actionable conflict information when the selection truly cannot be resolved.
- Cover real payload shapes with uppercase selected text, heading text in `selectionContext.prefix`, and the next section in `selectionContext.suffix`.

**Non-Goals:**

- Building a full rich-text editor or AST-based document editor.
- Allowing the AI to rewrite unrelated sections during a selected-text adjustment.
- Adding document version history, audit tables, or multi-user collaborative editing.
- Changing the public apply contract in a breaking way.

## Decisions

### Decision: Resolve selection against a rendered-source projection with structural metadata

The resolver should project Markdown into rendered text while preserving source offsets and block metadata such as heading, paragraph, list item, and table-ish text ranges. Matching should try exact source, normalized rendered, context-anchored rendered, and case-insensitive rendered matching only when prefix/suffix context disambiguates the target.

Alternative considered: ask the frontend to send Markdown offsets. That would be brittle because the browser preview does not expose the persisted Markdown positions and DOM selections can span multiple Markdown nodes.

### Decision: Expand targets to structural boundaries when the selection crosses Markdown syntax

When a selection begins or ends inside Markdown syntax, or when it spans a heading/list boundary, the resolved target should expand to the relevant Markdown block boundary. If the selected text is only the body below a heading, the target should remain the body range and the heading should be provided as surrounding context, not included in the replacement.

Alternative considered: always expand to the entire visible section. That reduces conflicts, but it gives the AI too much authority and can rewrite titles or adjacent sections when the user intended only a paragraph.

### Decision: Prompt with both rendered text and original Markdown source

The suggestion prompt should include the selected rendered text, the exact source Markdown target, the nearby Markdown excerpt, and a compact structure summary. The prompt must tell the provider which structures are allowed to change and which must remain untouched. For body-only selections under a heading, the provider should return body Markdown only; for heading-plus-body selections, it should keep the heading line separate unless the instruction explicitly asks to rename/remove the heading.

Alternative considered: only strengthen natural language instructions. That helps but is not reliable enough because the provider cannot infer the source formatting if it only sees plain rendered text.

### Decision: Normalize or reject structurally unsafe replacements

Before returning a suggestion, the backend should strip code fences/explanations, preserve expected heading/list/paragraph boundaries where possible, and reject replacements that appear to include adjacent section headings or unrelated document sections. Normalization should repair common provider mistakes, but it must not invent facts or silently rewrite outside the target.

Alternative considered: trust the provider and rely on user review. User review is useful, but malformed Markdown can make the preview look broken and can persist bad structure if the user applies it quickly.

### Decision: Keep apply deterministic with existing hash/source target checks

The apply endpoint should continue replacing only the returned `sourceTarget` when the source content hash and target text still match. Any richer selection diagnostics or prompt metadata should remain part of suggestion-time behavior and should not weaken apply safety.

Alternative considered: re-resolve the target during apply. That could make stale applies appear to work, but it risks applying a suggestion to a different passage than the provider saw.

## Risks / Trade-offs

- [Risk] Case-insensitive matching could select the wrong repeated passage. -> Mitigation: allow it only when rendered prefix/suffix context yields exactly one target.
- [Risk] Structural expansion could replace more text than the user intended. -> Mitigation: expand only when Markdown syntax would otherwise be left dangling or when the selected range actually includes a structural boundary.
- [Risk] Prompt context grows too large for long documents. -> Mitigation: include bounded local Markdown excerpts and a compact structure summary instead of the full document body.
- [Risk] Replacement normalization may over-correct a valid user-requested structural change. -> Mitigation: detect explicit structural instructions and prefer rejection over hidden rewrites when intent is unclear.
- [Risk] Some browser selections still cannot be mapped to source Markdown. -> Mitigation: return diagnostics that explain whether no match, ambiguity, or stale context caused the conflict.

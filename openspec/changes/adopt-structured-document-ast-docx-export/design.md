## Context

The current document flow still treats generated drafts as Markdown-like text. The backend stores `draftContent`, derives `draftContentJson` with `documentTextToTiptapJson`, and the frontend now prefers Tiptap JSON for the protected editor and completed preview. This improved editing parity, but the generation contract still loses structural intent before the editor sees it.

The preview already exposes disabled DOCX/PDF actions, but there is no real document export route. A reliable `.docx` file cannot be delegated to the AI model because DOCX is a zipped OOXML package that must be generated, validated, named, and served by application code.

## Goals / Non-Goals

**Goals:**

- Introduce a validated LicitaDoc document AST as the canonical structured document contract for generated drafts.
- Ask the generation pipeline for structured content instead of treating Markdown as the long-term canonical format.
- Persist structured content and derive Tiptap JSON plus compatibility text from the same source.
- Keep protected editor and completed preview behavior aligned with the existing Tiptap document surface.
- Add protected DOCX export for completed documents.
- Keep legacy documents usable by deriving AST from existing text or Tiptap JSON when needed.

**Non-Goals:**

- Do not ask the AI provider to return a `.docx`, base64 ZIP, OOXML package, or browser-rendered file.
- Do not replace the Tiptap editor as the interactive editing surface.
- Do not implement PDF export fidelity, comments, track changes, approval flows, or version history in this change.
- Do not expose internal pipeline traces or raw provider JSON in normal user-facing responses.
- Do not remove `draftContent` compatibility text in this change.

## Decisions

### Decision: Introduce a LicitaDoc AST instead of using DOCX or raw Tiptap JSON as the AI contract

The AI-facing output contract should be a small validated AST owned by LicitaDoc. The AST should describe document intent with constrained block kinds such as `heading`, `paragraph`, `list`, `table`, `pageBreak`, `signatureBlock`, `clause`, and `placeholder`, plus a small inline mark set for bold, italic, underline, and links when allowed.

Alternative considered: ask the AI to generate `.docx` directly. Rejected because DOCX is a binary package format, hard to validate from model output, hard to stream safely, and likely to produce corrupted downloads.

Alternative considered: ask the AI to generate Tiptap JSON directly. Rejected as the primary contract because Tiptap is an editor implementation detail and allows more structural states than the procurement document domain needs. Tiptap JSON remains the editor projection.

### Decision: Persist structured AST and keep current projections during transition

Successful generation should persist the validated AST as the structured source, derive `draftContentJson` for the editor/preview, and derive `draftContent` as compatibility text. If the implementation adds a new `draft_content_ast` JSONB column, reads and exports can prefer it. Existing documents without AST can be converted on demand from `draftContentJson` or `draftContent`.

Alternative considered: store only AST and remove text/Tiptap projections. Rejected because current preview, adjustment, tests, and generated client contracts still depend on compatibility content.

Alternative considered: store only Tiptap JSON. Rejected because the AST lets generation, export, and validation stay independent of editor internals.

### Decision: Normalize editor saves through the structured contract when possible

The protected editor can keep sending Tiptap JSON. The backend should validate that the saved editor JSON uses supported document nodes, normalize it into the LicitaDoc AST, then update AST, Tiptap JSON, text, and content hash together.

Alternative considered: let editor saves update only Tiptap JSON. Rejected because DOCX export would diverge from edited content or require a separate export-only conversion path.

### Decision: Generate DOCX server-side from structured content

DOCX export should live in the API. The export service should load the document under the same organization scope rules as reads, resolve structured content, convert supported AST blocks to OOXML using a server-side DOCX library, and send the file with the correct MIME type and attachment filename.

Alternative considered: generate DOCX in the browser from the preview DOM. Rejected because DOM styles are not a stable document model, browser export would duplicate server access rules, and generated files would be harder to test.

### Decision: Keep live generation preview compatible but non-authoritative

The final persisted AST is authoritative. During generation, the existing planning/progress UI can continue to show planning state and any available text preview, but completed documents must refetch the final structured content before preview/export is enabled.

Alternative considered: stream AST fragments into the preview. Rejected for the first version because partial JSON/AST streams are brittle and not needed to make the final document exportable.

### Decision: Treat legacy conversion as a compatibility layer

Legacy documents that only have `draftContent` should remain readable and exportable. Their AST can be derived using the existing text-to-Tiptap parser followed by a constrained Tiptap-to-AST conversion, or through a direct text-to-AST converter if that is cleaner.

Alternative considered: require regeneration before export. Rejected because completed documents already exist and users expect export to work from current drafts.

## Risks / Trade-offs

- [Risk] AST schema is too small for future document needs. -> Mitigation: version the AST and allow additive block/mark support with validation tests.
- [Risk] Provider returns malformed JSON or unsupported AST nodes. -> Mitigation: validate with Zod, retry/rewrite through the pipeline when possible, and fail generation instead of persisting unsafe content.
- [Risk] Tiptap-to-AST save normalization loses unsupported editor states. -> Mitigation: keep the editor extension set aligned with supported AST nodes and reject unsupported saves with a clear error.
- [Risk] DOCX output does not exactly match browser pagination. -> Mitigation: treat AST semantics, page breaks, headings, lists, tables, alignment, and signature blocks as the fidelity contract; leave browser-perfect pagination for a separate print/PDF change.
- [Risk] Adding a DOCX library increases backend dependency surface. -> Mitigation: keep the dependency server-only and cover generated file validity with focused tests.
- [Risk] Existing text adjustment flows operate on text offsets. -> Mitigation: keep `draftContent` projection updated and defer JSON-range adjustments to a later change.

## Migration Plan

1. Add the AST schema, validators, examples, and converters between AST, Tiptap JSON, and compatibility text.
2. Add persistent AST storage or an equivalent structured field strategy, with read-time fallback for legacy documents.
3. Update generation to request, validate, and persist AST, then derive existing projections.
4. Update editor save handling to keep AST, Tiptap JSON, text, and hashes in sync.
5. Add the DOCX export service and protected API route.
6. Wire the frontend DOCX action to download from the export endpoint.
7. Regenerate OpenAPI and API client artifacts if public contracts change.
8. Roll back by disabling the export route and falling back generation persistence to current text-to-Tiptap conversion; existing text and Tiptap projections remain intact.

## Open Questions

- Should `draftContentAst` be exposed in normal document detail responses, or kept internal to the API for generation/export only?
- Should AST generation be a single provider call or a final structuring pass after the current humanized draft?
- Which DOCX styles should be named and reusable for future organization letterhead work?

## Context

The current generation pipeline asks providers to return Markdown-like text, sanitizes that text, stores it as `draftContent`, and derives `draftContentJson` through `documentTextToTiptapJson`. That path works for well-behaved outputs, but recent model comparisons showed the weak spots: some providers wrap the whole document in code fences, leak rewrite prompts, add raw formatting markup, or produce structures that require brittle cleanup before the editor can use them.

The API already has a Tiptap JSON projection for editor and preview behavior, but the provider contract is still text-first. This change introduces a narrower foundation than the older DOCX-focused AST proposal: make completed generation structured and validated first, while leaving DOCX/export work for a later change.

## Goals / Non-Goals

**Goals:**

- Define a small versioned LicitaDoc document AST/envelope for generated procurement documents.
- Make supported providers return structured JSON for the final generation result.
- Validate structured output before marking generation as completed.
- Derive `draftContentJson` and compatibility `draftContent` from the same validated structured source.
- Keep existing document detail, preview, and editor behavior compatible during migration.
- Support OpenAI structured output and keep a provider-neutral fallback path for providers without structured-output support.

**Non-Goals:**

- Do not implement DOCX export in this change.
- Do not remove `draftContent` or `draftContentJson`.
- Do not expose raw provider JSON, chain-of-thought, or validation internals in normal document reads.
- Do not require live streaming preview to stream valid partial JSON.
- Do not ask providers to emit Tiptap JSON, DOCX, HTML, OOXML, base64 files, or renderer-specific payloads.

## Decisions

### Decision: Use a LicitaDoc AST envelope instead of Tiptap JSON as the provider contract

The provider-facing contract should be a small JSON envelope owned by LicitaDoc, for example `version`, `documentType`, `title`, `blocks`, and optional structured blocks such as `section`, `paragraph`, `list`, `table`, `placeholder`, `pageBreak`, and `signatureBlock`.

Tiptap JSON remains the editor projection. It is too editor-specific and permissive to be the AI contract: a model could produce valid Tiptap-shaped JSON that still contains unsupported nodes or presentation details the procurement domain does not want.

Alternative considered: request Tiptap JSON directly. Rejected because it couples generation to editor internals and makes schema validation harder to align with institutional document rules.

Alternative considered: continue Markdown and improve sanitizers. Rejected as the main path because sanitizers can remove known bad shapes, but they cannot prove the generated document has a valid structure.

### Decision: Validate before completing a generation run

The worker should only mark a generation as `completed` after the structured envelope parses and passes validation. Invalid JSON, unsupported block types, raw HTML, unknown marks, missing required signature data, or document-family mismatches should trigger a controlled retry/rewrite when possible, then fail the run if still invalid.

This keeps malformed outputs from becoming completed documents. It also gives cheaper models a fair path: they can be retried or rejected by contract instead of relying on visual inspection.

Alternative considered: persist first and validate asynchronously. Rejected because users can immediately open/export/read completed drafts, so invalid content must not be marked completed.

### Decision: Persist structured content and derive current projections

Successful generation should persist the validated structured content as the authoritative generation result, then derive:

- `draftContentJson` for editor and preview compatibility.
- `draftContent` as compatibility text for existing previews, hashes, text adjustment flows, and legacy consumers.

The preferred storage path is a new JSONB column such as `draft_content_ast` with Drizzle typing and route serialization kept additive. If implementation pressure requires a smaller first pass, the AST can be held in generation metadata only while still deriving the existing fields, but that should be treated as transitional and not the ideal endpoint.

Alternative considered: store only the structured AST. Rejected because current UI, tests, and adjustment flows still depend on text/Tiptap projections.

### Decision: Provider adapters expose one structured generation capability

OpenAI should use structured output support with a JSON schema where available. Other providers should report whether they support structured output so the pipeline can distinguish raw text fallback from validated structured output.

The shared provider interface can either add a structured generation method or accept a generation format option. The pipeline should own document semantics and validation; provider adapters should own vendor-specific request formatting and response extraction.

Alternative considered: keep provider adapters text-only and parse JSON from text in the pipeline for every provider. This can work as a compatibility layer, but it misses OpenAI schema enforcement and makes provider capabilities harder to inspect.

### Decision: Keep live preview best-effort and finalize from validated structure

During generation, the existing planning/progress UI can continue to show chunks or a text preview if the provider supplies usable text. The final saved document, however, must be derived from the validated structured result. If partial JSON streaming becomes useful later, it can be designed separately.

Alternative considered: stream AST fragments into the preview. Rejected for this change because partial structured streams are brittle and not necessary to solve completed-document quality.

### Decision: Keep legacy fallback explicit

Existing completed documents without structured output must remain readable. Fallback resolution should prefer persisted structured content, then valid `draftContentJson`, then legacy `draftContent` conversion. New generations should use structured output by default only when the selected provider/model supports the flow or the feature flag/config enables it.

This allows incremental rollout across providers and models without breaking current document reads.

## Risks / Trade-offs

- [Risk] The AST schema is too small for Minuta or future document features. -> Mitigation: version the schema and allow additive block kinds only through tests and explicit converter support.
- [Risk] Structured JSON increases output tokens. -> Mitigation: keep the AST compact, avoid duplicating rendered Markdown, and measure total cost against fewer rewrites/sanitization failures.
- [Risk] Unsupported providers may keep producing Markdown/text only. -> Mitigation: keep the fallback explicit and enable structured output only when provider capability/config supports it.
- [Risk] Existing text adjustment flows operate on text. -> Mitigation: keep `draftContent` projection updated and defer native AST-range edits to a later change.
- [Risk] Migration touches generation, persistence, conversion, and tests. -> Mitigation: implement behind a config/feature flag first and preserve Markdown fallback.
- [Risk] Existing broad AST/DOCX change overlaps. -> Mitigation: keep this change scoped to structured generation output only; DOCX/export can reuse the resulting AST later.

## Migration Plan

1. Define the AST envelope types, Zod schemas, fixtures, and validation errors.
2. Add converters from AST to Tiptap JSON and AST to compatibility text.
3. Add storage for structured content or a clearly transitional metadata strategy.
4. Update provider interfaces and adapters to support structured generation output.
5. Update DFD/ETP/TR/Minuta recipes to request the structured envelope and prohibit raw Markdown-only final output.
6. Update the generation pipeline to parse, validate, retry/repair if appropriate, and persist derived projections only after validation succeeds.
7. Keep legacy read fallback for documents without structured content.
8. Roll back by disabling structured generation config and falling back to the existing Markdown-to-Tiptap flow; existing `draftContent` and `draftContentJson` projections remain intact.

## Open Questions

- Should structured generation be enabled for all document types at once, or start with DFD because it is simpler and currently being benchmarked?
- Should `draftContentAst` be exposed in document detail responses or kept internal while the UI continues using `draftContentJson`?
- Should the pipeline use a direct structured writer call, or keep the current writer/humanization flow and add a final structuring pass?
- Should invalid structured output retry through the same model, a stronger fallback model, or a deterministic repair parser first?

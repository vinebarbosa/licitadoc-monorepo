## Context

The current text-adjustment implementation captures selected text from the rendered document preview, sends it to the backend for a suggestion, and later applies the suggestion by searching for the selected text inside `documents.draftContent`.

That is fragile because the preview renders Markdown, while `draftContent` stores Markdown source. Browser selections can omit list markers, collapse whitespace, remove emphasis markers, or span rendered elements differently than the source. When the backend cannot resolve the selected text exactly, it rejects the apply request, but the generated web client currently treats non-2xx responses as successful data for this mutation path.

## Goals / Non-Goals

**Goals:**
- Surface failed text-adjustment apply responses as visible errors instead of success toasts.
- Persist accepted suggestions when the selected rendered text maps unambiguously to the Markdown source.
- Keep stale-content and ambiguous-selection safeguards.
- Make the preview reflect the persisted document immediately after a successful apply.
- Cover the failure mode with focused API and web tests.

**Non-Goals:**
- This change does not add multi-turn chat or whole-document editing.
- This change does not introduce collaborative editing, revision history, or diff review.
- This change does not change print/export behavior beyond using the updated persisted draft.
- This change does not attempt to support every possible Markdown construct; unsupported or ambiguous mappings must fail clearly.

## Decisions

1. **Resolve the source target during suggestion**

   The suggestion endpoint will resolve the selected rendered text to an unambiguous target in the current Markdown source before returning a suggestion. The response should include the replacement text, the current source-content hash, and a stable source target such as `{ start, end, sourceText }`.

   Rationale: target resolution belongs on the server because the server owns the current draft and can make the persistence decision deterministically. Returning the resolved source target avoids re-matching rendered text during apply.

   Alternative considered: keep sending only `selectedText` and improve `indexOf` matching during apply. That still duplicates resolution work and keeps apply dependent on browser-rendered text.

2. **Apply by validated source target and hash**

   The apply endpoint will validate that the submitted `sourceContentHash` still matches the current draft and that `content.slice(start, end)` equals the target `sourceText`. Only then will it replace that source range with the accepted replacement.

   Rationale: this preserves stale-content protection while allowing selections whose rendered text differs from Markdown syntax. It also makes ambiguous selections fail before the provider call when possible.

   Alternative considered: accept offsets without verifying `sourceText`. That would be smaller but unsafe if a stale client submits offsets for a changed document with the same length or an accidental collision.

3. **Add Markdown-aware rendered-text matching**

   Target resolution will try exact source matching first, then a bounded Markdown-aware fallback that projects common source syntax into rendered-like text while retaining source offsets. The fallback should handle the current institutional document shapes: paragraph text, administrative list fields, list markers, headings, emphasis markers, and collapsed whitespace.

   Rationale: the current DFD preview often exposes administrative fields as rendered list items. Users naturally select what they see, not Markdown markers.

   Alternative considered: add source-offset attributes to every rendered text node in the React Markdown tree. That could be more exact long term, but it is larger and couples the UI renderer to persistence details.

4. **Make adjustment mutations throw on non-2xx responses**

   The document text-adjustment web hooks will use a throwing client/wrapper for suggestion and apply mutations, or otherwise explicitly inspect response status before calling mutation success handlers. On HTTP 400/409/500, the panel should show the backend message and must not show a success toast.

   Rationale: the generated Kubb client returns `res.data` and does not throw by default, so React Query can treat API errors as success unless wrapped.

   Alternative considered: change the shared API client globally. That may be a good later cleanup, but a focused wrapper limits risk to the document adjustment flow.

5. **Update the preview from the persisted response**

   After a successful apply, the web app will update the document detail cache with the returned document detail and invalidate the detail/list queries. The visible preview should reflect the persisted `draftContent` without waiting for a second fetch to return fresh data.

## Risks / Trade-offs

- Markdown projection can map too broadly -> keep exact matching first, require a single resolved target, and preserve conflict errors for ambiguous selections.
- A selected range may include Markdown structure that should not be removed -> tests should cover administrative list fields and paragraph selections; unsupported complex ranges can fail with a friendly error.
- Introducing target fields changes generated client types -> update OpenAPI schemas and regenerate `@licitadoc/api-client`.
- A focused throwing wrapper leaves other generated hooks with old behavior -> acceptable for this fix; broader client semantics can be handled separately.
- Provider suggestions may still change tone or facts -> existing prompt constraints remain unchanged; this change only affects reliable application.

## Migration Plan

No data migration is required. Existing completed documents continue storing Markdown in `draftContent`. The change updates request/response contracts for the adjustment endpoints and requires regenerating the API client before web tests compile.

## Open Questions

- None for implementation. If the Markdown-aware fallback cannot resolve a complex selection uniquely, the correct behavior is to reject the apply path and ask the user to select a smaller trecho.

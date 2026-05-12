## Context

The document preview currently renders stored `draftContent` as an institutional Markdown document and supports print/export actions. Generated content is persisted on the backend as Markdown in `documents.draftContent`, while provider calls already go through the shared `TextGenerationProvider` contract.

The requested interaction is selection-based: the user highlights part of the rendered document and asks for a change in natural language, similar to ChatGPT. The main technical challenge is preserving the document's formal procurement tone while applying only the intended excerpt back to Markdown content.

## Goals / Non-Goals

**Goals:**
- Show a floating prompt only when the user selects editable text inside a completed document preview.
- Send the user's instruction together with selected text and document context to the backend.
- Generate a replacement that keeps the tone, register, and factual boundaries of the current document.
- Let the user review the suggestion before applying it to persisted `draftContent`.
- Keep existing preview, live generation, print, and export flows working.

**Non-Goals:**
- This change does not introduce multi-turn chat history.
- This change does not support whole-document conversational editing without a selected target.
- This change does not stream adjustment responses in the first version.
- This change does not add collaborative editing or version history beyond the existing document update timestamp.

## Decisions

1. **Use a selection-anchored floating panel in the preview**

   The preview UI will listen for text selections inside the document sheet/body. When the selection is non-empty and belongs to the rendered document, it will show a compact floating prompt near the selection with an instruction input and submit action. Clearing the selection, clicking outside, or opening a non-completed/generating/failed document hides the panel.

   Alternative considered: add a static prompt box below the toolbar. That is easier to implement but loses the "adjust this text" affordance and makes the target ambiguous.

2. **Generate suggestions before persisting changes**

   The backend will expose a suggestion endpoint that receives the selected text, user instruction, and local selection context, then returns an adjusted replacement. The preview will show the suggested replacement with `Aplicar` and `Descartar`. Only the apply action will persist the updated Markdown.

   Alternative considered: submit-and-apply in one request. That is faster but risky because provider output could change legally sensitive procurement language without user review.

3. **Keep replacement deterministic**

   Applying a suggestion will replace the selected occurrence in the current `draftContent` only when the server can resolve the target unambiguously. The request should include `selectedText`, optional surrounding context, and an occurrence/index hint captured at selection time. If the content changed or the target is ambiguous, the backend returns a validation error and leaves the document untouched.

   Alternative considered: allow the model to return a full rewritten document. That increases drift risk and makes it harder to prove that only the intended excerpt changed.

4. **Reuse the existing generation provider**

   The adjustment service will call `app.textGeneration.generateText` through the existing provider abstraction with a prompt specialized for rewriting a selected excerpt. The prompt will include document type, selected text, relevant surrounding content, and enough full-document context to match tone without adding facts.

   Alternative considered: introduce a separate provider contract for rewrites. The existing contract is sufficient for this first version and already handles provider selection and normalized errors.

5. **Persist only accepted replacements**

   The apply endpoint will update `documents.draftContent` and `updatedAt` for authorized actors using the same organization-scope checks as document reads/managment. After success, the web app will invalidate/refetch the document detail query so print/export operate on the latest persisted content.

## Risks / Trade-offs

- **Rendered selection may not map cleanly to Markdown source** -> Start with deterministic matching against `draftContent` using normalized selected text plus context; show a friendly error asking for a smaller selection when the target cannot be resolved.
- **Provider output can introduce facts not present in the process** -> Prompt the provider to preserve factual content and only adjust wording; tests should assert that the service sends selected text, instruction, and context to the provider.
- **Long documents can create large prompts** -> Send selected text, bounded surrounding context, document type, and a truncated full-document tone sample instead of unbounded content.
- **Accidental edits to generating documents** -> Enable the feature only for completed documents with non-empty `draftContent`.
- **Stale suggestions after document changes** -> Apply requests must include a source content hash or equivalent guard so stale suggestions cannot overwrite newer draft content.

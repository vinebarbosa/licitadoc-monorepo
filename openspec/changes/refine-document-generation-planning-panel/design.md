## Context

The current live preview data path works: document generation can emit planning/thinking events separately from final document text events. The visual treatment still exposes the planning stream as a raw, growing text block, which makes the preview feel technical and distracts from the validated document layout.

This change is UI-only. It should refine how the web preview presents planning progress while keeping the existing backend event contract, generated document rendering, and completion behavior intact.

## Goals / Non-Goals

**Goals:**

- Present planning progress as a compact, polished status panel.
- Avoid showing raw detailed reasoning or adding a raw-detail button for now.
- Keep planning feedback visually separate from the document sheet.
- Preserve the final document preview as the main focus and keep exportable content clean.
- Keep the UI aligned with the restrained operational style used in the current app shell.

**Non-Goals:**

- Change Ollama thinking behavior or disable model thinking.
- Change the SSE event schema, provider contract, or generation worker flow.
- Persist planning/thinking content.
- Add a disclosure, drawer, modal, or debug view for raw reasoning details.
- Redesign the validated document preview layout.

## Decisions

1. Render planning as status, not transcript.

   The preview should use the planning stream as a signal that the model is analyzing, structuring, and preparing the document. It must not render the raw accumulated planning text as the main UI because that content is too verbose for the document workspace and is not part of the final document.

2. Use a compact panel above the document surface.

   The panel should sit outside the document sheet and use concise copy, subdued styling, and a small phase/progress treatment. This keeps the user informed without competing with the preview.

3. Keep phases generic and product-facing.

   The UI can show phases such as analyzing the process, organizing the structure, and preparing the writing. These labels should be derived from generation/planning state rather than displaying raw model text.

4. Do not expose raw reasoning controls in this iteration.

   The user explicitly does not want a button for detailed raw reasoning right now. Keeping that out also avoids making internal planning look like reviewable document content.

5. Preserve existing live document behavior.

   Final document chunks should continue to render with the current live/typewriter behavior as soon as response chunks arrive. If no response chunks have arrived yet, the pending preview remains available and can be accompanied by the compact planning panel when planning is active.

## Risks / Trade-offs

- Less transparency than a raw transcript -> The compact panel should communicate the AI is actively preparing the document, and detailed raw reasoning can be revisited in a future change if there is a clear review need.
- Generic phases can feel static -> Use subtle active/completed states tied to planning/document progress so the panel still feels alive.
- UI tests may currently assert raw planning text -> Update tests to validate the compact panel and absence of raw reasoning controls instead of raw transcript visibility.

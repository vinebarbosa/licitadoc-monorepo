## Context

The process title change introduced a concise `title` field and web helpers that prefer this title over the full `object`. The document creation page still renders each process picker option as `processNumber + object`, so long procurement objects overflow the selector and make the selected process hard to read.

The affected UI is limited to `DocumentCreatePageUI`, which obtains process records through `useProcessesPicker()` and uses the selected process only for linking and document name suggestion.

## Goals / Non-Goals

**Goals:**
- Show the concise process title in the document creation process picker.
- Keep the process number visible in both picker options and the selected trigger.
- Reuse the same title fallback behavior already used by process list/detail UI.
- Cover URL preselection and manual selection with tests.

**Non-Goals:**
- Change the generated document name format.
- Change document creation API payloads.
- Change how process titles are created or persisted.

## Decisions

1. Use the existing web process display helper for picker labels.

   The document creation page should call the same concise-title helper used by process list/detail UI, so fallback behavior remains consistent when `title` is blank or absent. The alternative would be duplicating the title derivation in the documents module, but that would make future display refinements easier to miss in one place.

2. Keep process number as a separate visual prefix.

   The picker should continue to show `process.processNumber` before the concise title. This preserves the exact process identifier while replacing the long object text with the readable title. The alternative of showing only the title would make similarly named processes harder to distinguish.

3. Leave document name suggestion tied to process number.

   `deriveInitialDocumentName(type, processNumber)` should remain unchanged because it creates compact document names like `DFD - SD-6-2026`. The title is only for selecting and recognizing the linked process in this screen.

## Risks / Trade-offs

- Importing a process display helper into the documents module increases coupling between feature modules -> Keep the dependency to a pure model helper already exported by the processes module, or extract a shared helper only if the existing import boundary rejects it.
- Long titles may still be wider than the select trigger -> Render the title inside a truncating inline element while preserving the process number.
- Responses without `title` could still occur during local dev or stale generated clients -> Use the helper fallback from title to object-derived text or process number.

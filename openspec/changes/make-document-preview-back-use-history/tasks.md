## 1. Back Button Behavior

- [x] 1.1 Replace the fixed preview back link with a button action.
- [x] 1.2 Use React Router history navigation to go back when there is a usable previous entry.
- [x] 1.3 Add a `/app/documentos` fallback for direct preview loads or missing usable history.
- [x] 1.4 Rename the action copy to `Voltar`.

## 2. Preservation

- [x] 2.1 Preserve existing print and export controls and enabled/disabled behavior.
- [x] 2.2 Ensure the action never navigates to the missing `/app/documento/:documentId` route.

## 3. Tests and Validation

- [x] 3.1 Update document preview tests for history-back behavior.
- [x] 3.2 Add fallback coverage for direct preview loads.
- [x] 3.3 Run focused document preview tests, web typecheck, Biome, and OpenSpec validation.

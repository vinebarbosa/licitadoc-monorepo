## 1. Mapping And State Model

- [x] 1.1 Add a tested mapper from `ExpenseRequestExtractionResult` to current `ProcessFormValues`, including process fields, items, organization hints, department matches, import summary, and warnings.
- [x] 1.2 Extend the process wizard state to store compact SD import metadata for UI feedback without sending unsupported fields to `POST /api/processes/`.
- [x] 1.3 Add unit tests for successful mapping, non-admin forced organization behavior, admin CNPJ organization matching, department budget-unit matching, and unmatched-reference warnings.

## 2. Import Dialog UI

- [x] 2.1 Add an SD import dialog component using existing shared UI primitives, file input, loading state, preview state, failure state, cancel action, and explicit apply action.
- [x] 2.2 Wire the dialog to `extractExpenseRequestFromPdf` and convert `ExpenseRequestPdfError.reason` values into diagnostic user-facing messages.
- [x] 2.3 Render extracted preview data for process basics, organization/department hints, items, source reference, file name, and warnings.
- [x] 2.4 Ensure selecting a new file refreshes only the dialog preview and closing the dialog leaves the underlying form unchanged.

## 3. Process Creation Integration

- [x] 3.1 Add a secondary "Importar SD" action to the current `/app/processo/novo` experience without displacing the manual form.
- [x] 3.2 Apply a successful preview into the wizard only after explicit confirmation, keeping populated fields editable.
- [x] 3.3 Show a compact imported-SD indication after apply, including source file or reference and any unresolved organization/department warnings.
- [x] 3.4 Preserve the existing manual submit payload shape and verify imported fields submit through the current `POST /api/processes/` flow.

## 4. Tests And Verification

- [x] 4.1 Add page tests covering dialog open/close, cancel without overwrite, successful SD apply, editable populated fields, diagnostic parser failure, and recovery after failure.
- [x] 4.2 Add submit test coverage proving an imported SD flow sends the reviewed wizard values rather than reparsing the PDF.
- [x] 4.3 Run `pnpm --filter @licitadoc/web typecheck`.
- [ ] 4.4 Run `pnpm --filter @licitadoc/web test`.

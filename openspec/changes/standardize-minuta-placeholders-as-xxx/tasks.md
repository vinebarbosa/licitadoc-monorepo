## 1. Placeholder Inventory

- [x] 1.1 Audit the generated Minuta path for raw `{{...}}` fallback values, especially budget allocation, organization address, authority fields, dates, contract numbers, contractor fields, and price.
- [x] 1.2 Compare the RH assessoria reference PDF placeholder style with current Minuta template and prompt context placeholders.

## 2. Minuta Placeholder Normalization

- [x] 2.1 Replace Minuta prompt context fallbacks that currently expose mustache tokens with contract-facing placeholders such as `XXX`, `XXX/2026`, `XX/XX/XXXX`, `[CONTRATADA]`, and `R$ XX.XXX,XX`.
- [x] 2.2 Update the Minuta template or template usage where raw placeholder tokens are likely to be copied into final output.
- [x] 2.3 Ensure real process data still overrides placeholders when valid values are present.

## 3. Final Output Sanitization

- [x] 3.1 Add or extend final document sanitization to convert unresolved `{{...}}` tokens to human-facing placeholders before persistence.
- [x] 3.2 Ensure Minuta price, budget allocation, dates, numbers, parties, and signatures use appropriate placeholder shapes when values are absent.
- [x] 3.3 Ensure sanitized Markdown is the source used for persisted Tiptap JSON and preview/PDF rendering.

## 4. Test Coverage

- [x] 4.1 Add unit tests proving Minuta prompt context no longer includes `{{budget.allocation_or_placeholder}}` when dotacao is absent.
- [x] 4.2 Add sanitizer tests proving copied `{{...}}` tokens are removed from final Minuta output.
- [x] 4.3 Add or update an RH assessoria Minuta scenario asserting final content contains `XXX`-style placeholders and no unresolved `{{...}}`.
- [x] 4.4 Add regression tests proving valid budget allocation, price, dates, numbers, and party fields are preserved when present.

## 5. Validation

- [x] 5.1 Run focused document-generation recipe tests.
- [x] 5.2 Run focused document-generation API tests that cover Minuta generation.
- [x] 5.3 Run API typecheck or the narrowest available type validation.
- [x] 5.4 Run OpenSpec validation for `standardize-minuta-placeholders-as-xxx`.

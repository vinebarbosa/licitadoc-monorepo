## 1. Recipe Assets

- [x] 1.1 Update `dfd-instructions.md` with universal DFD quality rules, object-aware guidance, and stronger anti-hallucination constraints.
- [x] 1.2 Update `dfd-template.md` so solicitation field values render as formal document text without inline code ticks.
- [x] 1.3 Add compact object-category guidance for cultural/event services, administrative services, goods, works, technology, health, and education without making any category mandatory.

## 2. Prompt Context

- [x] 2.1 Review `buildDfdGenerationContext` and prompt assembly to identify available canonical names, extracted item details, quantities, values, dates, and responsible role fields.
- [x] 2.2 Prefer canonical organization and department labels in DFD prompt context while preserving source abbreviations as supporting context or fallbacks.
- [x] 2.3 Include reliable item, quantity, value, and source metadata in the DFD context when present, with clear absence or zero-value semantics.
- [x] 2.4 Ensure the prompt tells the model not to state market compatibility, legal basis, duration, quantity, location, or contractor attributes unless those facts are present or directly supported.

## 3. Tests

- [x] 3.1 Add or update recipe tests proving the DFD assets contain object-aware guidance and do not hardcode Carnaval/FORRO TSUNAMI as reusable content.
- [x] 3.2 Add prompt assembly tests for a cultural/event process with absent or zero value, verifying the prompt discourages market-compatibility claims.
- [x] 3.3 Add prompt assembly tests for an administrative service process, verifying the prompt supports service-specific requirements without event-specific leakage.
- [x] 3.4 Add prompt assembly tests for a goods acquisition process, verifying quantity/specification/delivery guidance is available when relevant.
- [x] 3.5 Add tests proving generated/formatted DFD solicitation data is instructed as plain formal text and not inline code.

## 4. Validation

- [x] 4.1 Run the focused API document-generation recipe tests.
- [x] 4.2 Run the broader API test target relevant to documents if focused tests pass.
- [x] 4.3 Review the resulting prompt text manually against the SD-6-2026 Carnaval case and at least one non-event case to confirm the recipe remains general.

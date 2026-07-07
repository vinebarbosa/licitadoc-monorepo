## 1. Pricing Model Resolution

- [x] 1.1 Review current OpenAI pricing entries and decide the accepted pricing source/equivalence for `gpt-5.4-mini`.
- [x] 1.2 Add explicit pricing or alias resolution for supported OpenAI model strings that should produce numeric costs.
- [x] 1.3 Preserve `null` cost behavior for model strings without configured pricing.

## 2. Metadata And Aggregation

- [x] 2.1 Verify OpenAI provider metadata keeps the original configured model string while using the resolved pricing entry for cost calculation.
- [x] 2.2 Verify document-generation pipeline totals remain numeric when all calls are priced and remain visibly unset when any call is unpriced.

## 3. Tests And Verification

- [x] 3.1 Add unit tests for supported alias cost calculation, including `gpt-5.4-mini` if pricing is accepted.
- [x] 3.2 Add or update provider metadata tests to assert `costUsd` is recorded for supported priced aliases.
- [x] 3.3 Keep/update unknown-model tests to assert unpriced models return `null`.
- [x] 3.4 Run the focused API text-generation tests and any affected document-generation pipeline tests.

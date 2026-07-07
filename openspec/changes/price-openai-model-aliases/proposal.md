## Why

Recent OpenAI model experiments produced valid document-generation runs with `costUsd: null` because the exact model string was not present in the local pricing table. This makes model comparisons unreliable and hides real usage cost during provider evaluations.

## What Changes

- Add explicit handling for OpenAI model pricing aliases/version strings used in document generation experiments.
- Ensure supported priced OpenAI models record per-call and pipeline total cost instead of `null`.
- Preserve `null` cost for unknown or unpriced model strings rather than guessing silently.
- Add test coverage for newly supported model aliases and for the unknown-model fallback.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `generation-provider`: Generation provider metadata must include computed cost for supported priced OpenAI model aliases and retain a controlled unknown-model fallback.

## Impact

- Affected code: OpenAI usage cost calculation in `apps/api/src/shared/text-generation/usage-cost.ts`.
- Affected tests: text-generation cost and provider metadata tests.
- Affected behavior: generation run metadata for supported OpenAI aliases such as `gpt-5.4-mini` records numeric `costUsd` values and allows pipeline total cost comparisons.
- No API contract, database schema, or document-generation prompt behavior changes are expected.

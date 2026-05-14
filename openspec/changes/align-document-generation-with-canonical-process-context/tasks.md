## 1. Prompt Context Normalization

- [x] 1.1 Extend document-generation item evidence types/helpers to represent canonical simple items and kit items with ordered components.
- [x] 1.2 Update canonical item formatting so prompts include compact process item lines with code, title/description, quantity, unit, unit value, and total value when available.
- [x] 1.3 Update kit formatting so prompts include component title, description, quantity, and unit without flattening the kit to one description-only line.
- [x] 1.4 Make prompt item labels origin-aware, using neutral process-item wording for canonical items and SD-specific wording only for source-metadata fallback.

## 2. Estimate and Responsible Context

- [x] 2.1 Derive estimate/price raw values from canonical process item totals before reading source metadata estimate fields.
- [x] 2.2 Preserve legacy source metadata estimate fallback when canonical item totals are absent.
- [x] 2.3 Resolve responsible display data in document creation when canonical responsible-user data is available.
- [x] 2.4 Preserve fallback ordering from responsible-user display data to stored `responsibleName`, source metadata, and department responsible data.

## 3. Tests and Verification

- [x] 3.1 Add or update document-generation recipe tests for canonical simple item evidence and neutral item labels.
- [x] 3.2 Add or update document-generation recipe tests for kit component evidence in TR and Minuta prompts.
- [x] 3.3 Add or update document-generation recipe tests proving canonical item totals drive ETP estimate and Minuta price context.
- [x] 3.4 Add or update tests proving SD/source metadata wording and estimate fallback still work for legacy/imported rows.
- [x] 3.5 Add or update tests for responsible display resolution and fallback behavior.
- [x] 3.6 Run focused API document-generation tests and API typecheck.

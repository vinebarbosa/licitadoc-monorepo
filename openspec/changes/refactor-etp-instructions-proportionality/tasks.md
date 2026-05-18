## 1. Prompt Asset

- [x] 1.1 Replace `apps/api/src/modules/documents/recipes/etp.instructions.md` with the content from `openspec/changes/refactor-etp-instructions-proportionality/etp.instructions.proposed.md`.
- [x] 1.2 Review the final instruction asset for preserved anti-hallucination, Law 14.133, estimate, missing-data, DFD/TR exclusion, and signature-closing rules.
- [x] 1.3 Confirm `etp.template.md` and prompt assembly remain compatible without structural changes.

## 2. Test Coverage

- [x] 2.1 Update ETP recipe resolver tests to assert proportionality, object-specific density, repetition control, and operational concreteness guidance.
- [x] 2.2 Update ETP recipe resolver tests to assert strategic alternatives guidance includes SRP, ata adhesion, lot/parceling, kits, centralized supply, scope reduction, standardization, and logistical simplification where compatible.
- [x] 2.3 Preserve existing tests for missing/zero estimate handling, future price methodology, Law 14.133 guidance, no invented legal citations, SD item usage, and DFD/TR exclusion.
- [x] 2.4 Update prompt assembly tests if wording changes affect required semantic anchors.

## 3. Validation

- [x] 3.1 Run targeted API tests for document generation recipes.
- [x] 3.2 Run API typecheck or the narrowest available type validation.
- [x] 3.3 Run formatting/lint checks on the changed files, or document any pre-existing repo-wide lint failures separately.

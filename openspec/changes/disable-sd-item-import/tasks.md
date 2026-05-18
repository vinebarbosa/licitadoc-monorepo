## 1. Mapper Behavior

- [x] 1.1 Update the SD import mapper so applying an extraction preserves `ProcessFormValues.items` exactly as-is.
- [x] 1.2 Remove helper logic that converts extracted `expenseRequestItems` into wizard `ProcessItem` rows when it is no longer used.
- [x] 1.3 Keep extracted item count available only as preview context when useful, without feeding the form state.

## 2. UI Copy And Summary

- [x] 2.1 Adjust the SD import dialog copy so detected item rows are described as manual-entry context, not imported fields.
- [x] 2.2 Ensure the applied SD summary does not imply that items were imported.

## 3. Tests

- [x] 3.1 Update mapper unit tests to assert that applying SD to an empty item list leaves it empty.
- [x] 3.2 Add mapper coverage for preserving manually entered items after SD apply and reapply.
- [x] 3.3 Update process creation page tests so imported SD submission sends no items unless the user manually adds them.
- [x] 3.4 Add page coverage proving manually added items survive SD application.

## 4. Verification

- [x] 4.1 Run focused mapper and process creation page tests.
- [x] 4.2 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 4.3 Run Biome check for the changed process files.

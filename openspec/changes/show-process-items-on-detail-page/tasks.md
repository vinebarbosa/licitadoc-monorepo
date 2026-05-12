## 1. Data Normalization

- [x] 1.1 Add a web process model type for normalized process detail items and optional item components.
- [x] 1.2 Add a helper that extracts usable rows from `sourceMetadata.extractedFields.items`.
- [x] 1.3 Add fallback extraction for singular `sourceMetadata.extractedFields.item` when no usable item array exists.
- [x] 1.4 Guard partial or malformed metadata so missing fields do not render as `undefined`, `null`, or `NaN`.

## 2. Process Detail UI

- [x] 2.1 Add an item section below `Justificativa` in the process detail summary card.
- [x] 2.2 Render each item description or title with quantity, unit, unit value, and total value when available.
- [x] 2.3 Render component/subitem rows beneath their parent item when component metadata is present.
- [x] 2.4 Handle long descriptions with a readable responsive layout while keeping the full description accessible.
- [x] 2.5 Keep the process document cards below the summary card and avoid showing misleading item rows when no usable item metadata exists.

## 3. Verification

- [x] 3.1 Add or update process detail page fixtures for multiple items, partial item fields, singular legacy item metadata, long descriptions, and component metadata.
- [x] 3.2 Add or update web tests that assert the item section appears below justification and renders available item fields.
- [x] 3.3 Add or update web tests that assert no incorrect placeholders appear for missing fields.
- [x] 3.4 Run the relevant web test suite and OpenSpec validation for this change.

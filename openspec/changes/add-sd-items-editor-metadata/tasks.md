## 1. Frontend Item Model And Metadata Contract

- [x] 1.1 Add a reviewed SD item type to the process creation model with code, description, quantity, unit, unit value, total value, and UI-only id/source fields.
- [x] 1.2 Add an item array to process creation form values and default it to an empty list.
- [x] 1.3 Add helper functions to normalize reviewed items for metadata submission, dropping empty rows and UI-only fields.
- [x] 1.4 Update `buildProcessCreateRequest` to merge reviewed items into `sourceMetadata.extractedFields.items` and preserve the first item as `sourceMetadata.extractedFields.item`.
- [x] 1.5 Ensure manually entered items create minimal source metadata without overwriting unrelated process identity fields.

## 2. Frontend PDF Item Extraction

- [x] 2.1 Extend the browser TopDown SD parser to return `extractedFields.items` as a simple top-level item list.
- [x] 2.2 Parse item-table text by accumulating wrapped description lines until a numeric row with code, quantity, unit value, total value, and unit is found.
- [x] 2.3 Keep the existing singular `item` and `itemDescription` compatibility fields populated from the first detected item or existing fallback.
- [x] 2.4 Add warning behavior for readable SDs where process fields are extracted but item rows cannot be confidently detected.
- [x] 2.5 Cover the attached `SD DIAS DAS MAE` pattern in parser fixtures or representative inline test text.

## 3. Process Creation UI

- [x] 3.1 Add an `Itens da SD` section to the process creation form with controls to add, edit, and remove item rows manually.
- [x] 3.2 Render item fields in a compact desktop table or grid and a responsive stacked layout on smaller screens.
- [x] 3.3 Keep process submission valid when the items section is empty.
- [x] 3.4 Update dirty-state or form update logic so editing item rows does not unexpectedly rewrite object, title, department, or organization fields.
- [x] 3.5 Preserve current import, validation, and submit behavior for non-item process fields.

## 4. PDF Import Preview And Apply Flow

- [x] 4.1 Show extracted item count and preview rows inside the import dialog before applying PDF data.
- [x] 4.2 Applying an import should populate the editable `Itens da SD` section from extracted rows.
- [x] 4.3 Canceling or closing the import dialog must leave current item rows unchanged.
- [x] 4.4 Applying a second PDF import must replace the currently applied imported item rows with the new PDF item rows.
- [x] 4.5 Keep item warnings visible alongside existing PDF import warnings.

## 5. Persistence And API Compatibility

- [x] 5.1 Confirm process creation API accepts and persists the reviewed item metadata through the existing `sourceMetadata` JSON field.
- [x] 5.2 Ensure process detail/list serialization continues to return source metadata without requiring schema or migration changes.
- [x] 5.3 Avoid database migrations and avoid introducing a normalized process item table in this change.
- [x] 5.4 Keep direct backend PDF intake behavior unchanged unless a narrow compatibility adjustment is required.

## 6. Tests And Verification

- [x] 6.1 Add frontend parser tests for multi-item SD text, including wrapped descriptions followed by numeric item rows.
- [x] 6.2 Add process model tests proving reviewed items are serialized to `sourceMetadata.extractedFields.items` and compatibility `item`.
- [x] 6.3 Add process creation page tests for manual add/edit/remove item behavior.
- [x] 6.4 Add process creation page tests for PDF import preview, apply, cancel, and replacement behavior.
- [x] 6.5 Run focused web process model, PDF parser, and process creation page tests.
- [x] 6.6 Run relevant web typecheck.
- [x] 6.7 Run `openspec validate add-sd-items-editor-metadata --strict`.

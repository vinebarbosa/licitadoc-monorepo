## 1. Data Model And Metadata

- [x] 1.1 Extend the web process creation item model to support `simple` and `kit` item kinds.
- [x] 1.2 Add a component model for kit components with title or description, quantity, and unit fields.
- [x] 1.3 Add helpers to create, update, remove, and normalize simple items, kit items, and kit components.
- [x] 1.4 Add deterministic value parsing/calculation helpers for item totals while preserving manual total values.
- [x] 1.5 Update process creation request building to mark native form input in `sourceMetadata`.
- [x] 1.6 Update source metadata normalization to emit `extractedFields.items` with simple items, kit parent fields, and nested components.
- [x] 1.7 Preserve backward compatibility by keeping `extractedFields.item` as the first normalized item when items exist.
- [x] 1.8 Map PDF-imported flat rows into native simple items when PDF import is applied.

## 2. Multi-Step Creation UI

- [x] 2.1 Split the current process creation page into module-local wizard components.
- [x] 2.2 Add a stepper/navigation model for request data, links, items, and review.
- [x] 2.3 Implement the request/process data step with existing required process fields and validation.
- [x] 2.4 Implement the organization and department links step with existing role-aware reference data behavior.
- [x] 2.5 Implement the item builder step for adding, editing, and removing simple items.
- [x] 2.6 Implement kit item editing with parent kit fields and nested component rows.
- [x] 2.7 Ensure long kit/component descriptions remain readable without forcing one combined description field.
- [x] 2.8 Implement the final review step showing process data, links, simple items, kits, components, and totals.
- [x] 2.9 Keep submit success, submit failure, and reference-data failure behavior working inside the wizard.

## 3. API Contract And Persistence

- [x] 3.1 Add or update API process creation tests proving native simple item metadata is persisted and returned.
- [x] 3.2 Add or update API process creation tests proving native kit component metadata is persisted and returned.
- [x] 3.3 Update process OpenAPI examples or schema examples to document the native form metadata marker and item/component shape.
- [x] 3.4 Confirm no database migration is needed for the native item/component metadata shape.

## 4. Verification

- [x] 4.1 Add or update web model tests for native item/component creation, normalization, total calculation, and PDF row mapping.
- [x] 4.2 Add or update web page tests for step validation, backward navigation preserving data, simple item entry, kit/component entry, review, and submit payload.
- [x] 4.3 Add or update tests for import cancellation/failure preserving manually entered wizard data.
- [x] 4.4 Run focused web tests for process creation and model helpers.
- [x] 4.5 Run relevant API process tests.
- [x] 4.6 Run typecheck and OpenSpec validation for this change.

## Context

The current process creation page already creates procurement processes and can merge simple SD item rows into `sourceMetadata.extractedFields.items`. It is still a single-page form, and its item model is flat: each row is only code, description, quantity, unit, unit value, and total value. That works for simple SD rows, but it does not model the cases the product now needs to handle directly: kits with a parent item and multiple components, component descriptions, and a final review that makes the process complete before documents are generated.

The intent is to make `/app/processo/novo` the canonical native Solicitação de Despesa form. PDF import can continue to exist as a helper, but the supported structure should be the form's own item model rather than whatever a third-party PDF happened to encode.

## Goals / Non-Goals

**Goals:**

- Convert process creation into a multi-step wizard with clear progression and review.
- Model simple items and kit items explicitly.
- Store item data in a stable `sourceMetadata.extractedFields.items` structure that downstream process detail and document-generation context can reuse.
- Keep all creation validation client-side before submit and server-side through the existing process creation contract.
- Preserve the existing role-aware organization and department scoping behavior.

**Non-Goals:**

- Building a full procurement planning system beyond process creation.
- Editing created processes or items after creation.
- Replacing document generation recipes in this change.
- Removing PDF import entirely.
- Adding a database table for items; structured JSON metadata is enough for this step.

## Decisions

1. Use a wizard state model instead of route-per-step pages.

   The flow should stay in the existing process creation route and keep one local form state object. A local step controller is enough because all steps ultimately submit one process create request. This avoids extra routes and avoids partial process records before the user confirms.

   Alternative considered: create a draft process after step one and update it through later steps. That would make recovery easier, but it introduces incomplete persisted processes and update semantics that are outside this change.

2. Extend the frontend item model to support item kind and components.

   The current `ExpenseRequestFormItem` should evolve from a flat row into a native SD item shape with `kind: "simple" | "kit"`, `title`, `description`, quantity/value fields, and `components` for kits. Components should carry their own title, description, quantity, and unit.

   Alternative considered: keep kits as a long description in one flat row. That repeats the PDF problem and prevents the UI from showing component-level evidence cleanly.

3. Persist native form data through `sourceMetadata`.

   The process creation request should continue using the existing `sourceMetadata` JSON field. Native form output should set a stable marker such as `source.inputMode: "native_form"` and store normalized items under `extractedFields.items`; `extractedFields.item` can remain the first item for backward compatibility.

   Alternative considered: add first-class process item tables now. That would be cleaner for future editing and reporting, but it is a larger persistence change and not required to make creation and document context reliable.

4. Keep PDF import as a mapper into the native structure.

   If the existing PDF import remains visible, its extracted rows should populate the wizard item model. Imported rows without components can become simple items. The user can then correct them before review.

   Alternative considered: keep PDF import as a separate creation path. That keeps old code isolated, but it preserves two competing data shapes.

5. Calculate totals deterministically but allow manual correction.

   The UI should calculate total value when quantity and unit value are parseable. Users should be able to override total value because public-sector SDs often include formatting, rounding, or package-level values that do not map cleanly to a simple multiplication.

   Alternative considered: force calculated totals only. That is tidier, but risks blocking valid SDs with irregular value conventions.

## Risks / Trade-offs

- [Risk] Wizard complexity makes the page harder to maintain. -> Mitigation: split the page into module-local components for stepper, request data, links, item builder, and review.
- [Risk] Loose `sourceMetadata` can drift over time. -> Mitigation: centralize metadata normalization in the process model and add tests for simple items, kits, components, and legacy compatibility.
- [Risk] Kits can become deeply nested. -> Mitigation: support one parent kit with one component level only in this change.
- [Risk] Value parsing can misread Brazilian currency strings. -> Mitigation: parse only well-formed numeric/currency inputs, show calculated values as aids, and preserve user-entered values in metadata.
- [Risk] Existing PDF import tests may couple to flat item rows. -> Mitigation: keep mapping helpers backward compatible and add tests for imported rows becoming native simple items.

## Migration Plan

- No database migration is required.
- Existing process creation remains backed by `POST /api/processes`.
- Existing imported processes keep their current `sourceMetadata`.
- New native form submissions use the new metadata marker and item/component shape.
- Rollback is limited to reverting the frontend wizard and metadata normalization changes.

## Open Questions

- Should the visible item label be `Itens da Solicitação`, `Itens da SD`, or `Itens do Processo` across creation and detail?
- Should kit components eventually support their own values, or is quantity/unit/description enough for the first version?

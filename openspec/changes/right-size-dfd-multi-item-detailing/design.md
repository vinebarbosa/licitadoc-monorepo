## Context

The DFD generation context currently includes source item description, quantity, unit, unit value, and estimated value. That is useful context for many scenarios, but in multi-item acquisitions it can bias the DFD toward the first line item from the SD. Recent object consolidation work gives the prompt a better `multi_item` signal and aggregated item groups, but the DFD still needs stronger instructions to avoid turning the first item into the object or into technical requirements.

The DFD's role is to formalize the administrative demand. It should represent the acquisition as a set of materials when the source request is composite. Item-level quantity, unit, full specification, lot, and value belong to TR, item maps, price research, or later instruments.

## Goals / Non-Goals

**Goals:**

- Keep DFD object wording aggregated for multi-item acquisitions.
- Prevent individual first-item quantity/unit/specification from appearing as the main DFD object.
- Prevent DFD essential requirements from becoming item-level technical specs such as "550 unidades" or capacity-specific requirements.
- Preserve concrete multi-item groups already identified from the SD.
- Keep unitary DFD behavior unchanged.
- Add focused tests to protect DFD prompt and recipe behavior.

**Non-Goals:**

- Do not change ETP, TR, or Minuta behavior.
- Do not remove item quantity/unit context from TR or later documents.
- Do not change expense request parsing, database schema, public API, or provider configuration.
- Do not implement a new item map or item table feature.
- Do not make the DFD more detailed, denser, or more stylistically sophisticated.

## Decisions

### Decision: Add DFD-specific multi-item guidance instead of changing global item extraction

Implementation should keep item metadata available in the process and in non-DFD prompts, but DFD prompt assembly should include an explicit `multi_item` rule that item-level details are not drafting anchors for DFD object and essential requirements.

Alternative considered: remove item quantity/unit fields from all prompts. Rejected because ETP/TR/Minuta and unitary DFD scenarios may legitimately need those fields.

### Decision: Treat first-item fields as source traceability, not drafting instructions, for multi-item DFDs

If the context is `multi_item`, DFD generation may still expose source fields for auditability, but it must instruct the model not to mention individual item quantity, unit, lot, first-item value, or detailed specification in the final DFD object and essential requirements.

If tests show the prompt remains too biasing, implementation can hide or neutralize the display text for DFD multi-item only, while preserving the raw fields in the context object.

### Decision: Essential requirements should be administrative and group-level

For multi-item DFDs, requirements should be phrased as:

- supply of materials according to groups in the request;
- compatibility with the distribution or administrative purpose;
- delivery in adequate use, conservation, and presentation conditions;
- suitability of packaging and auxiliary materials for acondicionamento;
- observance of minimum specifications in the request and subsequent documents.

They should not specify quantities, units, capacity, lot, item-level values, or complete line-item composition.

### Decision: Tests should cover both prompt rules and recipe assets

Tests should assert that DFD prompt text contains the multi-item DFD restriction and that DFD recipes prohibit item-level quantity/spec leakage in object and requirements. Tests should also preserve existing unitary and generic DFD role guidance.

## Risks / Trade-offs

- [Risk] Removing item-level emphasis may make DFD less concrete. -> Mitigation: keep aggregated concrete item groups visible through the consolidated object fields.
- [Risk] Some unitary purchases legitimately need quantity in DFD. -> Mitigation: scope the restriction to `multi_item` object consolidation only.
- [Risk] The model may still copy item fields if they remain in context. -> Mitigation: add strong DFD-specific prompt rules and, if implementation requires, label item fields as not for DFD drafting when `multi_item`.
- [Risk] Tests may overfit one example. -> Mitigation: include the potes/kits/embalagens case and a general rule test around quantity/unit/specification leakage.

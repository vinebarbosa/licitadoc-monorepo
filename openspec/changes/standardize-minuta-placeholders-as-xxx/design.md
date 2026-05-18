## Context

The provided reference PDF, `MINUTA ASSESSORIA DE RH (1).pdf`, uses document-facing placeholders such as `XXX/2025`, `XXXXXXXXXXXXXXXX`, `R$ XXXXXX`, and `XX/XXXXX/XXXX`. The generated LicitaDoc output shown in the screenshot exposes an internal token in the final clause text: `{{budget.allocation_or_placeholder}}`.

The current Minuta flow has two places where this can happen:

- The Minuta template still contains mustache-style render placeholders, including `{{budget.allocation_or_placeholder}}`.
- The Minuta prompt context currently uses mustache tokens as fallback text for missing dotacao, organization address, authority, and related fields.

That means the Writer may copy a technical fallback directly into the final contract. The issue is especially visible in Minuta output because contractual placeholders are expected to look like normal administrative blanks, not template engine syntax.

## Goals / Non-Goals

**Goals:**

- Make visible Minuta placeholders look like contract placeholders, primarily `XXX`-style values.
- Prevent unresolved `{{...}}` tokens from appearing in final generated Markdown, preview, print, or PDF.
- Keep placeholders dry and contractual, without adding explanatory text such as "dados nao informados".
- Preserve the existing skill contract, humanization pass, reviewer, rewrite loop, and recipe architecture.
- Add tests that catch unresolved placeholder leakage in Minuta generation.

**Non-Goals:**

- Rewriting the entire Minuta template or legal clause structure.
- Changing the public document generation API.
- Inferring budget allocation, contractor data, dates, prices, or contract numbers when absent.
- Replacing valid process data with `XXX` when the process already contains a real value.

## Decisions

### Decision 1: Use contract-facing placeholder fallbacks before the Writer

Prompt context for Minuta should pass concrete placeholders such as `XXX`, `XXX/2026`, `R$ XX.XXX,XX`, `[CONTRATADA]`, `[CNPJ DA CONTRATADA]`, and `XX/XX/XXXX` instead of `{{...}}` tokens. This gives the Writer safe text to copy and aligns with the PDF reference.

Alternative considered: keep mustache placeholders and rely only on instructions. This already failed in the attached output because the model copied the token literally.

### Decision 2: Add a final unresolved-placeholder sanitizer

Even with better prompt context, final Minuta sanitization should defensively convert unresolved `{{...}}` tokens into human-facing placeholders. This should happen after model output and before persistence/Tiptap conversion so preview and PDF never receive technical tokens.

Alternative considered: fix only the template asset. That reduces one source but does not protect against legacy runs, model copy-through, or other fallback fields.

### Decision 3: Keep recipe templates structurally readable but not user-visible as raw tokens

The recipe can keep internal template markers where they help the Writer understand structure, but those markers must be replaced, rendered, or sanitized before the final document. For Minuta, direct placeholder examples in context should prefer the same visual language as the reference PDF.

Alternative considered: remove all mustache placeholders from every template immediately. That is broader than needed and could disrupt DFD, ETP, and TR template tests.

### Decision 4: Test both prompt inputs and final output

Tests should assert that:

- The Minuta prompt does not instruct the model to use `{{budget.allocation_or_placeholder}}` as the dotacao fallback.
- The final Minuta sanitizer removes any leftover `{{...}}`.
- The budget allocation clause renders with `XXX`-style placeholder text when no budget allocation exists.

## Risks / Trade-offs

- Placeholder over-normalization could erase valid values if the sanitizer is too broad -> Mitigation: only transform unresolved template-token syntax and known fallback tokens, not arbitrary process values.
- Templates for other document types still use mustache markers internally -> Mitigation: scope final-output enforcement to generated document content, with strongest test coverage for Minuta.
- `XXX` placeholders are less semantically descriptive than named tokens -> Mitigation: use surrounding clause text to explain the field, e.g. dotacao clause already says it is the dotacao orcamentaria.

## Migration Plan

1. Update Minuta prompt context fallbacks to use `XXX`-style placeholders.
2. Add or extend final output sanitization for unresolved template tokens.
3. Update Minuta recipe/template only where raw fallback tokens are directly likely to leak into final output.
4. Add unit tests for prompt context, sanitizer behavior, and RH assessoria Minuta output shape.
5. Run focused document-generation tests.

Rollback is straightforward: revert the placeholder fallback and sanitizer changes. No data migration is required.

## Open Questions

- Should all non-Minuta documents also convert unresolved `{{...}}` to `XXX`, or should DFD/ETP/TR keep a more document-specific fallback strategy?
- Should bracket placeholders like `[CONTRATADA]` remain as-is, or should they also become `XXXXXXXXXXXX` to match the reference PDF more closely?

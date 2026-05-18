## Context

The current Minuta sanitizer uses `enforceMinutaFixedClauses()` to ensure clauses marked with `FIXED_CLAUSE_START` in the Minuta template are present and canonical. The enforcement currently finds clauses by comparing normalized headings with the exact canonical fixed-clause heading. If a generated/revised Minuta contains a semantically equivalent but differently titled clause, the enforcer does not recognize it and appends the canonical fixed clause later.

The user-provided example shows this failure mode clearly:

- The generated document includes clauses like `DAS ALTERAÇÕES`, `DA MANUTENÇÃO DAS CONDIÇÕES DE HABILITAÇÃO`, `DA PUBLICAÇÃO`, `DOS CASOS OMISSOS`, and `DO FORO`.
- Then the sanitizer appends the canonical fixed clauses `DAS PRERROGATIVAS`, `DA ALTERAÇÃO E REAJUSTE`, `DAS CONDIÇÕES DE HABILITAÇÃO`, `DA PUBLICIDADE`, `DOS CASOS OMISSOS`, and `DO FORO`.
- The signature block appears before the appended fixed clauses, making the contract visibly broken.

This is a structural bug in the post-processing layer, amplified by review/rewrite because the model may simplify or rename fixed clauses before the enforcer runs.

## Goals / Non-Goals

**Goals:**

- Prevent duplicate final fixed clauses in generated Minutas.
- Preserve canonical fixed-clause wording from the template.
- Treat semantically equivalent headings as occupying the same fixed-clause slot.
- Move or rebuild the closing/signature block after all clauses.
- Keep review/rewrite from introducing alternative fixed-clause blocks.
- Add tests for the exact failure shape reported by the user.

**Non-Goals:**

- Rewriting the entire Minuta template.
- Removing the fixed-clause mechanism.
- Changing DFD, ETP, or TR behavior.
- Changing the public generation API.
- Deciding legal content for clauses beyond preserving the canonical template blocks.

## Decisions

### Decision 1: Canonical fixed clauses win over generated equivalents

When the generated draft contains a clause equivalent to a canonical fixed clause, the sanitizer should replace that whole generated clause block with the canonical fixed-clause block from the template. It should not keep both.

Alternative considered: keep the generated wording if close enough. This risks losing carefully maintained fixed legal language and still leaves inconsistent clause names.

### Decision 2: Detect equivalent final-clause aliases

Add alias matching for known Minuta tail clauses. Examples:

- `DAS ALTERAÇÕES` -> `DA ALTERAÇÃO E REAJUSTE`
- `DA MANUTENÇÃO DAS CONDIÇÕES DE HABILITAÇÃO` -> `DAS CONDIÇÕES DE HABILITAÇÃO`
- `DA PUBLICAÇÃO` -> `DA PUBLICIDADE`
- `DA EXTINÇÃO` -> `DA RESCISÃO E EXTINÇÃO`
- `DAS SANÇÕES ADMINISTRATIVAS` -> `DAS PENALIDADES`
- `DO FORO` -> `DO FORO`

Alternative considered: compare only clause numbers. This fails when the model renumbers clauses or omits a canonical fixed clause.

### Decision 3: Treat closing/signature as a single terminal block

The sanitizer should remove generated closing/signature blocks that appear before remaining clauses and append or preserve one terminal closing block after all clauses. The Minuta must not have signatures followed by more clauses.

Alternative considered: leave generated signatures untouched. The user example shows why this is unsafe: the signature block can land before appended fixed clauses.

### Decision 4: Reviewer/rewrite should flag fixed-clause duplication

The reviewer should detect repeated Minuta tail clause semantics and signatures followed by clauses. Rewrite instructions should ask for targeted correction without generating alternate fixed-clause sections.

Alternative considered: rely only on sanitizer. Sanitizer is necessary, but reviewer feedback makes the rewrite pass less likely to produce broken structure repeatedly.

## Risks / Trade-offs

- Alias matching may accidentally replace a legitimate custom clause -> Mitigation: scope alias matching to the Minuta tail and known fixed-clause topics.
- Removing generated closing blocks could remove useful custom signature details -> Mitigation: preserve party names when available in context/template, but ensure the closing appears once and last.
- Clause numbering can still drift if the model omits earlier clauses -> Mitigation: fixed-clause enforcement should operate by heading/topic and canonical block insertion, not by trusting model numbering alone.

## Migration Plan

1. Add Minuta clause-heading/topic utilities for canonical fixed clauses and known aliases.
2. Update `enforceMinutaFixedClauses()` to replace overlapping generated clauses instead of appending duplicates.
3. Add terminal closing/signature normalization for Minuta.
4. Add reviewer checks for duplicate Minuta tail clauses and signatures before later clauses.
5. Add regression tests using the duplicated clause example.
6. Run focused document-generation tests and typecheck.

Rollback is straightforward: revert sanitizer/reviewer changes. No data migration is required.

## Open Questions

- Should clause alias metadata live beside the Minuta template, or in TypeScript near the sanitizer?
- Should the system eventually render Minuta from a structured clause model instead of asking the model to produce a full Markdown contract?

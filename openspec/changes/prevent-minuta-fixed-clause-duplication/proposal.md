## Why

Generated Minutas can duplicate final contractual clauses after review/rewrite: the model writes its own clauses for sanctions, extinction, alterations, habilitation, publication, omitted cases, forum, and signatures, then the Minuta fixed-clause enforcement appends the canonical FIXED clauses because it does not recognize the rewritten headings as equivalent. The result is a contract that looks stitched together, repeats clauses 13-18, and places signatures before additional clauses.

## What Changes

- Make Minuta fixed-clause enforcement clause-aware, so it replaces or removes overlapping model-generated final clauses instead of appending canonical clauses after them.
- Detect equivalent final-clause headings even when the model uses different wording, such as "DAS ALTERAÇÕES" vs. "DA ALTERAÇÃO E REAJUSTE", "DA PUBLICAÇÃO" vs. "DA PUBLICIDADE", or "DA EXTINÇÃO" vs. "DA RESCISÃO E EXTINÇÃO".
- Ensure the closing/signature block appears only once and remains after all contractual clauses.
- Strengthen reviewer/rewrite guidance so rewrite cycles do not create alternative fixed-clause blocks or duplicate the canonical Minuta tail.
- Add regression tests using the duplicated example shape supplied by the user.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `document-generation`: Final Minuta output must remain structurally canonical after review/rewrite and sanitization, without duplicate fixed clauses or premature signatures.
- `document-generation-recipes`: Minuta fixed clauses must be enforced by replacing overlapping generated clauses rather than appending duplicates.

## Impact

- Affected backend modules: Minuta sanitization, fixed-clause enforcement, review/rewrite prompts, document-generation tests.
- Affected outputs: Minuta Markdown, preview, print/PDF rendering, persisted `draftContent`, persisted `draftContentJson`.
- API compatibility: no public request or response shape change is expected.

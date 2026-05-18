## 1. Diagnosis and Fixtures

- [x] 1.1 Add a regression fixture or test input based on the user-reported duplicated Minuta tail.
- [x] 1.2 Audit Minuta fixed-clause enforcement, reviewer checks, and rewrite prompts to confirm where duplicate tail clauses and premature signatures are allowed.

## 2. Fixed-Clause Alias Enforcement

- [x] 2.1 Add canonical Minuta tail topic detection for fixed clauses and known equivalent headings.
- [x] 2.2 Update fixed-clause enforcement to replace overlapping generated clause blocks with canonical fixed blocks instead of appending duplicates.
- [x] 2.3 Preserve canonical fixed clauses unchanged when they are already present.
- [x] 2.4 Ensure generated clauses for sanctions, extinction, alterations, habilitation, publication, omitted cases, and forum do not duplicate canonical tail topics.

## 3. Closing and Signature Normalization

- [x] 3.1 Detect Minuta closing/signature blocks that appear before later contractual clauses.
- [x] 3.2 Remove or relocate premature closing/signature blocks so the final Minuta ends with exactly one closing/signature section.
- [x] 3.3 Ensure witness placeholders and party signatures are not duplicated.

## 4. Reviewer and Rewrite Guardrails

- [x] 4.1 Extend the document reviewer to flag duplicate Minuta fixed-clause topics.
- [x] 4.2 Extend reviewer checks for signatures or closing text followed by later clauses.
- [x] 4.3 Update rewrite prompt guidance so the Final Rewrite Agent keeps canonical fixed clauses and does not regenerate alternative tail sections.

## 5. Test Coverage

- [x] 5.1 Add sanitizer tests for the user-reported duplicated Minuta tail.
- [x] 5.2 Add tests proving alias headings are mapped to canonical fixed clauses.
- [x] 5.3 Add tests proving an already canonical Minuta tail is not duplicated.
- [x] 5.4 Add pipeline or reviewer tests proving duplicate fixed clauses and premature signatures are flagged before rewrite.

## 6. Validation

- [x] 6.1 Run focused document-generation recipe tests.
- [x] 6.2 Run focused document-generation pipeline/API tests that cover Minuta review/rewrite.
- [x] 6.3 Run API typecheck or the narrowest available type validation.
- [x] 6.4 Run OpenSpec validation for `prevent-minuta-fixed-clause-duplication`.

## 1. ETP Recipe Structure

- [x] 1.1 Refactor `etp.template.md` to add dedicated risks and expected-benefits sections and renumber conclusion/closing.
- [x] 1.2 Rewrite `etp.template.md` section guidance to favor institutional paragraphs, logical transitions, and section-specific depth over checklist answers.

## 2. ETP Editorial Instructions

- [x] 2.1 Update `etp.instructions.md` with anti-checklist, anti-AI, fluent institutional prose, and high-density administrative reasoning guidance.
- [x] 2.2 Add Law 14.133/2021 and TCU-oriented planning guidance while prohibiting unsupported article numbers, acórdãos, or legal conclusions.
- [x] 2.3 Add natural missing-data phrasing guidance and richer methodology language for absent estimates, market research, budget data, and execution details.
- [x] 2.4 Deepen section-specific guidance for solution execution, market methodology, alternatives, estimate, budget, impacts, fiscalization, risks, benefits, and conclusion.

## 3. Prompt Assembly Guardrails

- [x] 3.1 Add final ETP prompt rules for context consistency across object, municipality, organization, department, item, estimate state, and inferred profile.
- [x] 3.2 Add final ETP prompt rules preventing data leakage from DFD/TR/minuta examples, previous generations, or unrelated process contexts.

## 4. Tests

- [x] 4.1 Update ETP recipe tests to assert new risks and expected-benefits sections, narrative-quality guidance, natural absence wording, and legal/planning guardrails.
- [x] 4.2 Update ETP prompt tests to assert context-consistency final rules and anti-invention behavior for missing estimates and market research.
- [x] 4.3 Update create-document/sanitization coverage for ETP section renumbering while preserving mandatory estimate-section fallback behavior.

## 5. Validation

- [x] 5.1 Run OpenSpec validation for `elevate-etp-generation-quality`.
- [x] 5.2 Run focused backend document generation tests.
- [x] 5.3 Run API typecheck.

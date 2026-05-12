## 1. Recipe Assets

- [x] 1.1 Refine `etp.instructions.md` with stronger section-depth, subject-aware, and anti-invention guidance.
- [x] 1.2 Refine `etp.template.md` so the canonical ETP structure explicitly covers methodology, alternatives, risks, fiscalization, and recommendation quality.

## 2. Prompt Assembly

- [x] 2.1 Add an inferred ETP analysis profile to backend prompt assembly using existing process context.
- [x] 2.2 Add final prompt rules that keep the inferred profile editorial-only and preserve estimate/market research safety.

## 3. Tests

- [x] 3.1 Update recipe/prompt tests to verify the improved ETP guidance, analysis profile, and missing-estimate behavior.
- [x] 3.2 Update create-document coverage to verify the ETP prompt still prevents simulated market research and includes the improved profile guidance.

## 4. Validation

- [x] 4.1 Run OpenSpec validation for `improve-etp-generation-quality`.
- [x] 4.2 Run focused backend document generation tests.

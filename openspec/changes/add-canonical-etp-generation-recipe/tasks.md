## 1. Recipe Assets

- [x] 1.1 Create `apps/api/src/modules/documents/recipes/etp.instructions.md` with ETP editorial rules, including absent-estimate and no-simulated-market-research constraints
- [x] 1.2 Create `apps/api/src/modules/documents/recipes/etp.template.md` with the canonical ETP headings and dynamic placeholders derived only from the ETP reference block
- [x] 1.3 Update the document-generation recipe resolver so `documentType=etp` returns the ETP instruction and template assets while existing DFD behavior remains unchanged

## 2. ETP Prompt Assembly

- [x] 2.1 Implement an ETP context builder that combines process fields, department data, organization data, and `sourceMetadata.extractedFields` when available
- [x] 2.2 Add estimate normalization that treats missing values, empty values, `0`, `0,00`, `0.00`, and `R$ 0,00` as unavailable rather than valid prices
- [x] 2.3 Update document-generation prompt assembly so ETP requests use the canonical recipe, normalized estimate context, process context, and operator instructions before invoking the provider
- [x] 2.4 Include prompt rules allowing reuse/adaptation of overlapping DFD/process context while forbidding DFD/TR headings in the final ETP

## 3. Sanitization

- [x] 3.1 Extend generated-draft sanitization so stored ETP content keeps only the canonical ETP document and removes DFD/TR sections or preambles
- [x] 3.2 Ensure the ETP value-estimate section remains present after sanitization even when no estimate is available

## 4. Validation

- [x] 4.1 Add tests for ETP recipe resolution and template exclusion of DFD/TR sections
- [x] 4.2 Add tests for ETP context fallback behavior and zero-value estimate normalization
- [x] 4.3 Add document-generation tests covering ETP prompt assembly with `R$ 0,00`, successful draft persistence, and absence of fictitious values or simulated market research instructions
- [x] 4.4 Add sanitization tests covering generated ETP content that includes accidental DFD or TR sections

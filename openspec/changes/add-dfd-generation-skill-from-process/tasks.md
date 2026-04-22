## 1. Recipe Assets

- [x] 1.1 Create the repository-managed DFD instruction asset that defines the editorial skill for generating a DFD from a stored process
- [x] 1.2 Add the canonical DFD Markdown template derived only from the DFD portion of the approved reference document
- [x] 1.3 Introduce a recipe resolver/registry so `documentType=dfd` loads the DFD instruction asset and Markdown template at runtime

## 2. DFD Prompt Assembly

- [x] 2.1 Implement a normalized DFD context builder that combines process fields, department data, organization data, and `sourceMetadata.extractedFields` when available
- [x] 2.2 Update document-generation prompt assembly so DFD requests use the canonical recipe plus operator instructions before invoking the text-generation provider
- [x] 2.3 Constrain the generated DFD flow so the prompt and persisted draft stay limited to the DFD structure and do not include ETP/TR sections

## 3. Validation

- [x] 3.1 Add tests for DFD recipe resolution and context fallback behavior
- [x] 3.2 Add document-generation tests covering DFD prompt assembly, successful draft persistence, and exclusion of ETP/TR sections from stored DFD content

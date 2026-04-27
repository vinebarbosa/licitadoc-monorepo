## 1. Recipe Assets

- [x] 1.1 Create `apps/api/src/modules/documents/recipes/tr.instructions.md` with TR editorial rules, absent-estimate safety, no-invented-technical-data constraints, and `Obrigacoes por tipo de contratacao`
- [x] 1.2 Add all required obligation blocks to `tr.instructions.md`: `apresentacao_artistica`, `prestacao_servicos_gerais`, `fornecimento_bens`, `obra_engenharia`, `locacao_equipamentos`, and `eventos_gerais`
- [x] 1.3 Create `apps/api/src/modules/documents/recipes/tr.template.md` with the canonical TR headings and dynamic placeholders derived only from the TR reference block
- [x] 1.4 Update the document-generation recipe resolver so `documentType=tr` returns the TR instruction and template assets while existing DFD and ETP behavior remains unchanged

## 2. TR Prompt Assembly

- [x] 2.1 Implement or reuse a TR context builder that combines process fields, department data, organization data, and `sourceMetadata.extractedFields` when available
- [x] 2.2 Reuse estimate normalization so missing values, empty values, `0`, `0,00`, `0.00`, and `R$ 0,00` are unavailable rather than valid prices
- [x] 2.3 Add contracting-type guidance to the TR prompt so obligations are selected primarily from the matching instruction block
- [x] 2.4 Update document-generation prompt assembly so TR requests use the canonical recipe, normalized estimate context, process context, obligation guidance, and operator instructions before invoking the provider
- [x] 2.5 Include prompt rules allowing reuse/adaptation of overlapping DFD/ETP/process context while forbidding DFD/ETP headings in the final TR

## 3. Sanitization

- [x] 3.1 Extend generated-draft sanitization so stored TR content keeps only the canonical TR document and removes DFD/ETP sections or preambles
- [x] 3.2 Ensure the TR value-estimate and budget section remains present after sanitization even when no estimate is available
- [x] 3.3 Ensure sanitized TR content does not retain prohibited headings such as `DADOS DA SOLICITACAO`, `LEVANTAMENTO DE MERCADO`, or `ANALISE DE ALTERNATIVAS`

## 4. Validation

- [x] 4.1 Add tests for TR recipe resolution and template exclusion of DFD/ETP sections
- [x] 4.2 Add tests verifying `tr.instructions.md` contains the required obligation blocks and conservative missing-data/value rules
- [x] 4.3 Add tests for TR prompt assembly with `R$ 0,00`, successful draft persistence, and absence of fictitious value or simulated market-research instructions
- [x] 4.4 Add tests covering obligation guidance for at least `apresentacao_artistica`, `prestacao_servicos_gerais`, and `fornecimento_bens`
- [x] 4.5 Add sanitization tests covering generated TR content that includes accidental DFD or ETP sections

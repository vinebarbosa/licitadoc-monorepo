## 1. Context Normalization

- [x] 1.1 Locate every document-generation path that reads or renders `process.type` or `context.processType`.
- [x] 1.2 Add a document-facing process type formatter with explicit mappings for known stored values, including `licitacao` -> `Licitação`.
- [x] 1.3 Use the formatter when building DFD generation context so prompt lines receive the normalized label.
- [x] 1.4 Ensure unknown slug-like values are humanized safely without changing already readable text.

## 2. Recipe and Prompt Safety

- [x] 2.1 Update DFD recipe/template references so document-facing placeholders no longer render raw `process.type`.
- [x] 2.2 Check ETP, TR, and Minuta context assembly for the same process type leak and route them through the same formatter if applicable.
- [x] 2.3 Keep stored process values and process API serialization unchanged.

## 3. Verification

- [x] 3.1 Add or update unit tests proving DFD prompt/context for `process.type = "licitacao"` contains `Licitação`.
- [x] 3.2 Add regression coverage proving the assembled DFD prompt does not contain `Processo: licitacao`.
- [x] 3.3 Run the relevant API document-generation tests.
- [x] 3.4 Run typecheck or targeted static checks for the touched API files.

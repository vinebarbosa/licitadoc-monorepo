## Why

Generated documents are leaking the stored process type slug (`licitacao`) into user-facing administrative text. This makes otherwise good DFD generations look unfinished and forces the model to infer formatting that should be deterministic in the backend.

## What Changes

- Add a canonical display label for process types used in document-generation context.
- Ensure DFD and other generated-document prompts receive the human-readable process type, such as `Licitação`, instead of raw persistence values like `licitacao`.
- Preserve the stored `process.type` value for database/API compatibility; only document-facing context should be normalized.
- Add regression coverage so generated context does not expose raw process-type slugs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: Generated documents must receive process type values as document-facing labels instead of raw stored slugs.
- `document-generation-recipes`: Document recipe templates and context assembly must not expose raw process type placeholders in final prompt material.

## Impact

- Affected backend code is expected in `apps/api/src/modules/documents`, especially generation context assembly and recipe/template usage.
- Existing process storage, process APIs, and historical documents do not need schema changes.
- Tests should cover at least the DFD context path that currently produces `Processo: licitacao`.

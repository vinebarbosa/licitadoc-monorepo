## Why

Generated documents are still treated primarily as Markdown text, then converted into editor JSON through a lossy parser. That makes formatting fragile for institutional editing and leaves DOCX export without a reliable structured source.

LicitaDoc already has a Tiptap-based editor and preview path. This change promotes generation output into a validated document AST, then derives editor JSON, compatibility text, and DOCX files from that structured source.

## What Changes

- Introduce a repository-owned LicitaDoc document AST contract for generated procurement documents.
- Require successful generation to produce or be normalized into validated AST before persisting editable content.
- Convert validated AST into Tiptap JSON for editor and preview parity.
- Preserve compatibility `draftContent` text as a derived projection during the transition.
- Add a DOCX export capability for completed documents, generated deterministically from structured document content.
- Wire the preview page DOCX action to a real protected backend export endpoint.
- Keep legacy documents exportable by deriving structured content from existing `draftContent` when `draftContentJson` or AST is not present.
- Keep the generated file as an output artifact; `.docx` is not the source of truth and is not generated directly by the AI provider.

## Capabilities

### New Capabilities

- `document-structured-ast`: Defines the validated LicitaDoc document AST used as the structured generation and conversion contract.
- `document-docx-export`: Defines protected DOCX export behavior for completed documents.

### Modified Capabilities

- `document-generation`: Generation must persist a validated structured document representation and derive editor/text projections from it.
- `document-generation-recipes`: Recipes must instruct providers to return structured document content rather than treating Markdown as the canonical long-term format.
- `api-route-schemas`: Document export routes and any new structured document fields must be described through Zod-backed route contracts and exported OpenAPI metadata.

## Impact

- Affected backend modules: `apps/api/src/modules/documents`, shared document conversion utilities, document generation pipeline, document route schemas, and document tests.
- Affected frontend modules: document preview actions, document API hooks, generated API client types, and preview/export tests.
- Likely new backend dependency: a DOCX writer library such as `docx`, kept server-side only.
- Database impact: may add a JSONB column for canonical AST metadata/content, or use existing `draft_content_json` as the immediate editable projection while keeping AST derivation deterministic.
- Contract impact: additive API route for DOCX export and additive response fields if AST is exposed internally or in document detail responses.

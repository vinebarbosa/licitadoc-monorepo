## Why

The document preview currently exposes text-selection adjustment controls, which makes a viewing route behave like an editing surface. Preview should remain read-only because document editing and AI-assisted text changes already have a dedicated document editing page.

## What Changes

- Remove text adjustment controls from the document preview experience, including the floating "Ajustar texto" panel, suggestion generation, apply flow, and adjustment skeleton overlay.
- Keep preview focused on viewing generated document content and existing non-editing actions such as print/export.
- Keep document editing and text adjustment behavior scoped to the dedicated document editing page or other explicit editing flows.
- Update preview tests so selecting text in preview never opens editing UI or calls adjustment APIs.

## Capabilities

### New Capabilities
- `document-preview`: Defines the document preview route as a read-only viewing surface that must not expose editing or text-adjustment controls.

### Modified Capabilities
- None.

## Impact

- Affected frontend UI: `apps/web/src/modules/documents/ui/document-preview-page.tsx`
- Affected frontend tests: `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
- No backend API, database, or generated API client changes are expected unless cleanup reveals frontend-only adjustment hooks are unused outside preview.

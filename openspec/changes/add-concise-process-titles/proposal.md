## Why

Process detail and listing screens currently use the full procurement object as the display title, which can produce very long headings and make the process hard to scan. A concise process title should be created alongside the full object so users see a readable name without losing the complete administrative text.

## What Changes

- Add a concise process title to the process profile used by process list/detail UI.
- Keep the existing full `object` field as the canonical procurement object for documents, search context, and administrative review.
- During manual process creation, derive a short default title from the submitted object when no title is supplied.
- During Solicitação de Despesa import, derive a short title from the most concise extracted source value, preferring item description when available and falling back to a shortened object/classification.
- Allow the frontend creation/import flow to preview and submit the concise title while keeping it editable before creation.
- Preserve backwards compatibility for existing processes by falling back to a derived title when stored rows do not yet have one.

## Capabilities

### New Capabilities

- `web-process-concise-titles`: frontend process creation/import and process display surfaces use a concise process title while preserving the full object.

### Modified Capabilities

- `process-management`: process records and responses expose a concise title for display while preserving the full object.
- `expense-request-process-intake`: SD-backed process creation derives and stores a concise title from parsed SD context.
- `expense-request-pdf-intake`: PDF import/prefill derives a concise title from extracted SD fields before the reviewed process is submitted.

## Impact

- Affects process persistence/schema, serializers, create/update payloads, and process API examples.
- Affects backend SD text/PDF intake paths that create processes from imported source data.
- Affects frontend process creation/import models and process list/detail display helpers.
- Requires focused API tests for manual creation, SD intake, serialization, and fallback behavior.
- Requires frontend model/page tests for title derivation, import prefill, reviewed submission, and display.

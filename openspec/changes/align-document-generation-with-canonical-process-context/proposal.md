## Why

Process creation now stores canonical process fields and structured items, but document generation still carries legacy assumptions from SD/source metadata. This can make new manually created processes generate weaker drafts: estimates may be treated as missing, kit components may disappear from the prompt, and prompt copy may call every item an "SD" item even when no SD import was used.

## What Changes

- Make document generation treat canonical process fields and structured process items as the primary prompt context.
- Derive estimate/value context from canonical item totals when available, falling back to source metadata only for legacy/imported processes.
- Preserve kit component evidence in generation context so TR and Minuta prompts can reason about the actual kit contents.
- Use neutral prompt labels such as `Itens do processo` for canonical items, reserving SD-specific wording for imported SD/source metadata fallback.
- Resolve the responsible display name from canonical responsible-user data when available, with `responsibleName` and department fallbacks for current/legacy rows.
- Add focused generation prompt tests for canonical simple items, kit components, item-derived estimates, neutral item copy, and responsible fallback behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: Generation prompt assembly must consume canonical process fields, structured items, kit components, item-derived estimates, and responsible display data before falling back to legacy source metadata.

## Impact

- Affected code: `apps/api/src/modules/documents/documents.shared.ts`, `apps/api/src/modules/documents/create-document.ts`, and related document-generation tests.
- Data/API: no public route changes, no database migration, and no generated client changes are expected.
- Behavior: generated DFD, ETP, TR, and Minuta drafts should better reflect manually created processes and kit-based item structures.

## Why

Automatic pagination currently renders additional document sheets, but overflowing text can continue in the same document flow instead of moving to the next page. This breaks the core expectation of the editor and preview: when content passes the usable page height, following blocks must visually start on the next sheet.

## What Changes

- Correct automatic pagination so page frames and content displacement are produced from the same measured layout plan.
- Detect overflowing top-level TipTap blocks by their rendered position against the usable page boundary, not only by accumulated estimated height.
- Apply a non-persisted visual spacer before the first block that belongs on the next page.
- Prevent fallback page-count expansion from rendering extra sheets without corresponding content-flow boundaries.
- Keep manual page breaks compatible with automatic page overflow.
- Preserve the canonical TipTap JSON without saving generated automatic page breaks.

## Capabilities

### New Capabilities

- `document-pagination-flow-displacement`: Ensures automatically paginated editor and preview content visually jumps to the correct page when rendered content exceeds the usable page height.

### Modified Capabilities

- None.

## Impact

- Affects the shared document pagination surface, pagination planning utilities, public document editor demo, protected document editor, and completed JSON preview.
- Adds or updates tests for measured overflow boundaries, page-frame count consistency, manual break compatibility, and browser-visible pagination behavior.
- Does not require API, database, dependency, or saved TipTap JSON schema changes.

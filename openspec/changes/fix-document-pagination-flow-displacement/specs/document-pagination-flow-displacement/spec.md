## ADDED Requirements

### Requirement: Automatic pagination MUST move overflowing content to the next page
The document editor and JSON preview MUST visually move content that exceeds the usable height of a page onto a subsequent document sheet. Rendering additional page frames without moving the overflowing content MUST NOT be considered successful pagination.

#### Scenario: Overflowing block starts on the next page
- **WHEN** rendered TipTap content contains a top-level block whose bottom would exceed the current page's usable height
- **THEN** the pagination layer applies a non-persisted automatic boundary before that block
- **AND** the block visually starts inside the usable area of the next page

#### Scenario: Page frame count matches flow boundaries
- **WHEN** the pagination layer renders more than one visual page because content overflows
- **THEN** the layout includes automatic or manual boundary state that moves content onto those pages
- **AND** the system does not render extra page frames solely from content scroll height without matching content-flow displacement

### Requirement: Pagination MUST be derived from rendered block positions
The pagination layer MUST derive automatic overflow boundaries from measured rendered positions of top-level content blocks against the configured page geometry.

#### Scenario: Margins and lists affect overflow
- **WHEN** headings, paragraphs, lists, or formatted blocks create rendered spacing that causes a page overflow
- **THEN** the pagination layer detects the overflow from measured layout positions
- **AND** following content is displaced to the correct page

#### Scenario: Content removal updates displacement
- **WHEN** a user removes content so a later block fits on an earlier page
- **THEN** the pagination layer removes or moves the affected automatic boundary
- **AND** the visual page count updates to match the current measured layout

### Requirement: Automatic boundaries MUST remain transient
Automatic page boundaries and their spacer values MUST remain derived presentation state and MUST NOT be written into the saved TipTap JSON document.

#### Scenario: User saves automatically paginated content
- **WHEN** a user saves a document that has automatic visual page boundaries
- **THEN** the saved TipTap JSON contains the document content without generated automatic page-break nodes
- **AND** reopening the editor recalculates the visual boundaries from layout

### Requirement: Manual page breaks MUST stay compatible with automatic displacement
Manual page breaks MUST continue to force page boundaries while automatic overflow boundaries are calculated before and after them.

#### Scenario: Manual break and automatic overflow coexist
- **WHEN** a document contains a manual page break and enough content to overflow pages automatically
- **THEN** the manual break starts following content on a new page
- **AND** automatic boundaries continue moving later overflowing blocks onto subsequent pages

### Requirement: Browser verification MUST confirm content movement
Verification for automatic pagination MUST confirm that overflowing content moved to the next page, not only that multiple page frames are visible.

#### Scenario: Demo editor visual check
- **WHEN** `/demo/documento/editor` renders long TipTap JSON content
- **THEN** the browser-visible layout shows overflowing content beginning inside the next sheet
- **AND** at least one automatic boundary marker exists for the moved block

#### Scenario: Preview visual check
- **WHEN** the same saved TipTap JSON content is opened in completed preview
- **THEN** the preview positions automatic boundaries at materially the same block locations as the editor for the same page geometry
- **AND** the preview shows content on subsequent pages rather than continuous text over page frames

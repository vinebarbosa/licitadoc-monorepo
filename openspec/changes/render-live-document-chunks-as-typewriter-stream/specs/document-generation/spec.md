## ADDED Requirements

### Requirement: Realtime document preview MUST render received chunks progressively
The realtime document generation preview MUST render incoming generation chunks as progressive visible text while the document is still generating. The preview MUST use ordered chunk deltas as the live writing source and MUST NOT rely only on replacing the visible preview with the latest accumulated event content.

#### Scenario: Chunk deltas become visible in order
- **WHEN** the frontend receives multiple `chunk` events for a generating document
- **THEN** it appends each event's `textDelta` to the live preview in arrival order
- **AND** the visible document content grows progressively before the completion event

#### Scenario: Burst chunks are smoothed into visible writing
- **WHEN** several `chunk` events arrive before the browser paints the next frame
- **THEN** the frontend queues the received deltas
- **AND** drains them into visible preview content over successive ticks or frames
- **AND** avoids jumping directly to the latest accumulated `content` value as the only visible update

#### Scenario: Snapshot reconciles visible stream
- **WHEN** the event stream sends a snapshot containing more accumulated content than the frontend has received locally
- **THEN** the frontend reconciles its received buffer from the snapshot
- **AND** continues rendering any missing suffix progressively without duplicating already visible text

#### Scenario: Completion preserves authoritative final content
- **WHEN** the event stream sends a `completed` event
- **THEN** the frontend reconciles to the completed event content
- **AND** closes the realtime stream
- **AND** triggers the existing document detail refetch so the persisted `draftContent` remains authoritative

#### Scenario: Stream fallback remains available
- **WHEN** the realtime stream is unavailable or fails before useful chunks arrive
- **THEN** the preview keeps the existing pending/fallback behavior
- **AND** document detail polling remains responsible for showing the final persisted document after generation completes

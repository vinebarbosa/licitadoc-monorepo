## Context

The authenticated home page already renders "Continuar de onde parei", but those cards are local mocked document rows. The same page already calls `useProcessesList` for the "Processos de Contratacao" table, and each listed process item carries the document summary needed to express process progress.

The backend currently derives `documents.completedCount`, `documents.totalRequiredCount`, `documents.completedTypes`, `documents.missingTypes`, and `listUpdatedAt` for process list items. To make "ultimos processos" truthful, the cards should be based on activity represented by `listUpdatedAt`, not only on process creation date.

## Goals / Non-Goals

**Goals:**
- Replace mocked document cards with process cards from real process listing data.
- Treat each expected generated document (`dfd`, `etp`, `tr`, `minuta`) as 25% of process progress.
- Rank resume cards by recent process/document activity.
- Reuse existing process module helpers and route builders where possible.
- Keep loading, empty, and error states honest for the resume section.

**Non-Goals:**
- Add per-user editing history or audit tracking.
- Create a new resume-work endpoint.
- Change the required generated document set beyond `dfd`, `etp`, `tr`, and `minuta`.
- Redesign the broader Central de Trabalho layout.

## Decisions

### Decision: Make resume cards process-first

The section should map process list items to cards instead of keeping a separate document mock model. This matches the user's mental model: they resume a contracting process, and the generated documents communicate how far that process has advanced.

Alternative considered: keep document cards and only change labels. That would preserve the current structure, but it keeps the weaker concept and makes the 25% progress rule feel arbitrary.

### Decision: Derive progress from expected generated document types

Progress should be `completedCount / totalRequiredCount * 100`, where the current expected total is four document types. With the current document set, each completed type contributes 25%. The UI should clamp the computed value between 0 and 100 and avoid hard-coded per-card percentages.

Alternative considered: store a separate process progress field. That would add another source of truth while the document summary already expresses the same state.

### Decision: Use activity timestamp for recency

Resume cards should use `listUpdatedAt` for ordering and display because that timestamp includes process and related document activity. If the listing endpoint returns rows ordered by creation date, update the backend ordering so the first page is suitable for recent-work surfaces.

Alternative considered: fetch a larger created-date page and sort it in the browser. That is simpler locally, but it can miss an older process that was recently updated.

### Decision: Reuse the existing process list request

The home page can continue to make one process list request and use the returned rows for both the resume cards and the process table. The card area should take the first three activity-ordered items, while the table can continue rendering the page-size set already returned.

Alternative considered: make a second query only for resume cards. That would give independent loading states, but it duplicates traffic and cache entries without a new contract.

## Risks / Trade-offs

- Backend ordering changes may alter the "Processos de Contratacao" table order on the home page and process listing page -> cover the expected order in API and web tests.
- `listUpdatedAt` is process-level activity, not actor-specific activity -> document this as the current product behavior and leave per-user work history out of scope.
- Processes with failed or generating documents may look incomplete -> count only completed expected document types, matching the existing document summary semantics.
- Empty organizations will no longer show illustrative resume cards -> show an honest empty state that guides the user to create or open a process.

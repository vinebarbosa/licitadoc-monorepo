## Context

Processes currently have a single text field, `object`, that carries the full procurement object and is also used as the display name in the web list and detail pages. Imported TopDown SDs often place a long formal classification in that field, so the detail heading can become a full paragraph. The full object is still important for administrative review and document generation, so the display problem should be solved by introducing a concise title rather than shortening or replacing `object`.

## Goals / Non-Goals

**Goals:**

- Persist or expose a concise, non-empty process `title` for list/detail display.
- Keep `object` as the complete procurement object used by generated documents and review fields.
- Derive a sensible title automatically for both manual creation and SD/PDF import.
- Let users review and edit the title during frontend process creation.
- Preserve existing processes by deriving a response title when no stored title exists.

**Non-Goals:**

- Do not use an LLM or external service to generate process titles.
- Do not rewrite historical `object` values.
- Do not remove or weaken the existing SD source metadata used by document generation.
- Do not make title derivation a substitute for user review; imported and manual values remain editable.

## Decisions

### Decision: Add a distinct `title` field instead of truncating `object` in the UI

The backend should accept, store, serialize, and update a `title` value independently from `object`. The web UI should use `title` for process names and keep `object` available as the full legal/administrative description.

Alternatives considered:

- Truncate `object` only in React helpers. Rejected because it would hide the problem visually while keeping no durable reviewed title for future views, search, or API clients.
- Replace `object` with a shorter value. Rejected because generated documents and procurement review need the full object text.

### Decision: Use deterministic title derivation with source-aware inputs

The title helper should normalize whitespace, remove common procurement boilerplate from the beginning when safe, prefer short SD item descriptions for imported processes, and cap generated titles to a readable length. If a submitted title is present, the backend should trim and use it; otherwise it derives one from the best available source and finally falls back to the process number/object.

Alternatives considered:

- Generate titles with the configured text-generation provider. Rejected because process creation should remain fast, deterministic, offline-friendly, and free from provider latency/failures.
- Require users to type every title manually. Rejected because import should produce a useful reviewed draft without extra clerical work.

### Decision: Make the API response title non-empty even if storage is nullable during migration

The database can add `processes.title` as nullable to avoid risky backfills, while serializers return a non-empty derived title when the stored title is missing. New manual and imported processes should store a concrete title at creation time.

Alternatives considered:

- Add a non-null title with a bulk SQL backfill. Rejected because a TypeScript derivation helper can produce better titles than a simple SQL substring, and response fallback covers old rows safely.
- Keep title only in `sourceMetadata`. Rejected because manual processes need the same display behavior and source metadata is not the process profile.

### Decision: Frontend preview mirrors backend derivation but backend remains authoritative

The creation page should show a `Título` input. Manual object edits can suggest/update the title while the title field is untouched. PDF import should preview and apply a suggested title from extracted item description/object. The backend should still derive a title if the client omits one.

Alternatives considered:

- Hide the title field and always derive silently. Rejected because users need to correct awkward automatic titles before creation.
- Depend only on frontend derivation. Rejected because API clients and backend SD/PDF intake paths must remain consistent.

## Risks / Trade-offs

- [Risk] Deterministic title derivation may produce imperfect phrasing for unusual objects. -> Mitigation: expose the title as editable in creation and update flows.
- [Risk] Existing generated API clients may need regeneration after schema changes. -> Mitigation: include API schema/example updates and frontend type updates in the implementation tasks.
- [Risk] Nullable storage plus non-null response can obscure missing backfill data. -> Mitigation: keep the fallback helper covered by tests and store titles for all newly created processes.
- [Risk] Frontend and backend derivation helpers can drift. -> Mitigation: test both against representative SD/manual examples and keep the frontend helper as preview-only.

## Migration Plan

1. Add a nullable `title` column to `processes`.
2. Update backend create/update schemas, serializers, and OpenAPI examples so API responses include non-empty `title`.
3. Store a derived title for new manual and imported processes.
4. Update the frontend process model, creation form, import preview, and list/detail display helpers.
5. Roll back by ignoring the title column/field and falling back to `object`; no destructive data migration is required.

## Open Questions

- Should process search include `title` in addition to existing searchable fields?
- Should a later maintenance task backfill stored titles for old rows, or is response fallback sufficient?

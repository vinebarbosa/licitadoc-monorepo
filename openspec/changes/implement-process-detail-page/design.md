## Context

The public demo page already validates the intended process detail layout, but the protected process detail module currently renders only a placeholder. The process API already returns profile fields, departments, native items, summary, and document card metadata, but the validated layout also needs display-ready organization context and robust empty/error handling.

The workspace already contains adjacent process create/edit work, so this implementation should reuse the current process module API hooks, model helpers, shadcn-style shared UI components, and existing document routes.

## Goals / Non-Goals

**Goals:**
- Implement `/app/processo/:processId` with the validated demo composition and real API data.
- Keep all data loading inside the process module through `useProcessDetail`.
- Expose process detail API fields needed by the page, especially organization display context.
- Render native stored process items, including kit components, without depending on legacy source metadata.
- Preserve document generation/edit/preview navigation semantics.
- Cover the behavior with focused API and web tests.

**Non-Goals:**
- Redesign the validated process detail UI.
- Implement actual document duplication/deletion from the detail page.
- Change process creation/editing flows beyond compatibility with the detail response.
- Add database migrations unless the existing schema cannot represent the required data.

## Decisions

1. Use the demo page as the visual source and adapt it to existing app primitives.

The protected page will preserve the demo hierarchy: header, executive summary, process info, items, institutional context, control dates, and document actions. Styling should use the existing shared UI components and app-shell spacing so the page feels native inside `/app`.

Alternative considered: build a smaller page around the previous migrated detail spec. That would ship faster but would not honor the newly validated product UI.

2. Extend the process detail response with organization context.

The page should not issue a second organization request just to render "Contexto Institucional". `GET /api/processes/:processId` already owns process detail aggregation, so it should include a compact organization object with at least `id` and `name`.

Alternative considered: render only `organizationId` in the UI. That would technically avoid an API change but would degrade the validated layout and user comprehension.

3. Prefer native `items` over legacy `sourceMetadata` for the item section.

The backend now persists reviewed process items and components. The detail page should render `process.items` and use `summary` for counts and totals. Legacy source metadata helpers can remain for compatibility, but the primary detail UI should not depend on imported PDF extraction shape.

Alternative considered: keep reading items from `sourceMetadata.extractedFields`. That duplicates older behavior and misses manually reviewed item edits.

4. Keep document actions as links and informational overflow actions.

Primary actions should navigate to existing document creation/edit/preview routes. Non-implemented secondary actions such as duplicate can remain toast-backed placeholders so the UI is complete without inventing backend behavior.

Alternative considered: hide unavailable overflow actions. That would reduce UI surface but lose parity with existing document list affordances.

## Risks / Trade-offs

- API client drift -> Regenerate `@licitadoc/api-client` after changing OpenAPI schemas and run focused web tests.
- Existing dirty workspace changes overlap process types -> Keep edits scoped, inspect files before touching them, and avoid reverting adjacent process create/edit work.
- Detail item values can be partial or non-numeric -> Format display values defensively and avoid rendering `undefined`, `null`, or `NaN`.
- OpenSpec telemetry emits network errors in the sandbox -> Treat telemetry flush failures as non-blocking when the CLI command itself completes successfully.

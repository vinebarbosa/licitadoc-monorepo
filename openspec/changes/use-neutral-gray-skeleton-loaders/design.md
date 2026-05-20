## Context

The authenticated web app uses a shared `Skeleton` primitive from `apps/web/src/shared/ui/skeleton.tsx`. That primitive currently renders with `bg-accent`, and the current accent token is blue, so loading rows in operational tables visually compete with real brand and status elements.

The screenshot shows this most clearly in the process listing table: placeholder bars are saturated enough to look intentional rather than temporary. The affected surfaces are broad because process, document, app-home, department, user, preview, and editor loading states all import the same shared primitive.

## Goals / Non-Goals

**Goals:**

- Make shared skeleton loaders render as subtle neutral gray in light and dark themes.
- Keep skeleton loaders animated, rounded, and layout-stable.
- Apply the change through the shared UI primitive or design-system token boundary so existing skeleton usages inherit the fix.
- Keep brand blue available for actual actions, selected states, focus affordances, status indicators, and icons.

**Non-Goals:**

- Redesign table layouts, loading behavior, or pagination.
- Change primary, accent, sidebar, status, or chart colors globally.
- Replace page-specific loading states with a new skeleton architecture.
- Add backend, API, database, or generated-client changes.

## Decisions

### Decision: Change the shared `Skeleton` primitive instead of page-level classes

The implementation should update `apps/web/src/shared/ui/skeleton.tsx` so the default skeleton background uses a neutral token such as `bg-muted` or a dedicated neutral skeleton token if one is added to `apps/web/src/styles.css`.

This keeps the change aligned with `web-design-system-foundation`: skeletons are reusable design-system primitives, not product-module-owned visuals. Existing custom sizing classes such as `h-4 w-24` continue to work because callers only compose dimensions and shape.

Alternative considered: override each process/document/user table skeleton individually. Rejected because it would leave future skeletons easy to regress and would duplicate a visual rule that belongs in shared UI.

### Decision: Do not repurpose `accent`

The current blue is coming from `accent`, but `accent` may still be useful for interactive highlights elsewhere. The skeleton fix should avoid changing `--accent` globally because that would affect unrelated hover states, cards, and active UI affordances.

Alternative considered: make `--accent` gray. Rejected because it broadens the blast radius beyond loading placeholders.

### Decision: Validate by component contract and at least one representative loading surface

Testing should cover the shared primitive so future changes do not reintroduce `bg-accent`. A focused page or component test should also keep a representative table loading state rendering the shared skeleton, preferably reusing existing process or document listing coverage if convenient.

Alternative considered: visual-only validation. Rejected because the regression is a small class/token change that is cheap to assert in tests.

## Risks / Trade-offs

- [Risk] `bg-muted` may be too low contrast on some surfaces. -> Mitigate with a quick browser check against a table/card loading state and, if needed, introduce a dedicated neutral skeleton token between `muted` and `border`.
- [Risk] Some non-shared skeleton-like placeholders may still use `bg-primary` or blue utility classes. -> Mitigate by searching for loading placeholder patterns and only updating places that are genuine skeletons, leaving real progress/status indicators alone.
- [Risk] A broad color-token change could dull interactive UI. -> Mitigate by scoping the visual change to `Skeleton` and avoiding global `primary` or `accent` edits.

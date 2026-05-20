## 1. Shared Skeleton Styling

- [x] 1.1 Update `apps/web/src/shared/ui/skeleton.tsx` so the default background uses a neutral gray loading treatment instead of `bg-accent`.
- [x] 1.2 If `bg-muted` is not visually strong enough in light or dark mode, add a dedicated neutral skeleton token in `apps/web/src/styles.css` and map it through Tailwind theme tokens.
- [x] 1.3 Search for skeleton-like loading placeholders that bypass the shared `Skeleton` primitive and update only genuine loading placeholders that still render blue.

## 2. Test Coverage

- [x] 2.1 Add or update shared UI smoke coverage to assert the `Skeleton` primitive no longer defaults to the accent/primary blue background.
- [x] 2.2 Add or update a representative page/component test for a table loading state, such as processes or documents, to ensure loading rows render through the shared neutral skeleton.

## 3. Verification

- [x] 3.1 Run focused frontend tests covering the shared skeleton primitive and representative loading table.
- [x] 3.2 Run the relevant web validation command for the touched package.
- [ ] 3.3 Open a representative loading surface in the browser and verify the skeleton bars read as subtle neutral gray, not blue.

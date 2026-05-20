## Why

Skeleton loaders in the authenticated web app are currently reading as blue, which makes loading placeholders look like branded content or status indicators instead of quiet temporary structure. The product needs a subtler neutral treatment so loading states feel calm, scannable, and visually secondary across process, document, department, user, and app-shell tables.

## What Changes

- Update the shared web skeleton loading visual treatment from the current blue/accent appearance to a subtle neutral gray.
- Keep skeleton loaders animated, rounded, and layout-preserving, but make their color independent from the primary brand blue.
- Apply the change through the shared UI/design-system boundary so existing page-level skeletons inherit the neutral treatment without per-page overrides.
- Preserve existing brand blue usage for real actions, focus states, icons, selected states, and status accents.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-design-system-foundation`: shared skeleton primitives and loading placeholders must use a neutral gray visual token rather than the primary/accent blue treatment.

## Impact

- Affected frontend code: `apps/web/src/shared/ui/skeleton.tsx`, `apps/web/src/styles.css` if a dedicated token is needed, and any focused tests or visual assertions around shared UI primitives and loading states.
- Affected UI surfaces: process listing, documents listing, document preview/edit loading states, app home recent processes, owner departments, owner users, and any other page that imports the shared `Skeleton`.
- No backend, API, database, generated client, or dependency changes are expected.

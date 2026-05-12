## Why

The app shell already has a supported header component, but the fuller header behavior still lives in `tmp/app-header.tsx`. Migrating the relevant parts into the frontend architecture removes temporary-code drift and gives the protected app shell a consistent notification and theme control surface.

## What Changes

- Move the applicable app header behavior from `tmp/app-header.tsx` into the supported `apps/web/src/modules/app-shell` architecture.
- Keep the sidebar trigger, separator, breadcrumbs/title behavior, notification button, and light/dark theme toggle.
- Remove the search bar from the app header surface.
- Use the web app's existing theme provider and shared UI primitives instead of temporary aliases or `next-themes`.
- Preserve protected app-shell composition without introducing runtime imports from `tmp`.

## Capabilities

### New Capabilities
- `web-app-header`: Covers the protected app shell header surface, including navigation context, notifications, and light/dark theme toggling.

### Modified Capabilities

## Impact

- Affects `apps/web/src/modules/app-shell/components/app-header.tsx` and any shell layout props that only existed to support header search.
- May affect app-shell tests or snapshots where header controls are asserted.
- No backend API, generated client, database, or dependency changes are expected.

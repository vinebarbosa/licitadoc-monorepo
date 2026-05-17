## Why

The contextual help widget is meant for users requesting help, but admin users answer support tickets from the admin inbox. Showing the requester widget to admins creates duplicate support entry points and makes the admin support workspace feel noisy.

## What Changes

- Hide the contextual help widget for authenticated users with the `admin` role.
- Keep the widget visible for authenticated non-admin users who still need to request support.
- Preserve the admin support inbox as the canonical support workflow for admins.
- Add regression coverage so the widget does not return to admin layouts accidentally.

## Capabilities

### New Capabilities
- `help-widget-role-visibility`: Controls which authenticated roles can see the contextual help widget inside the app shell.

### Modified Capabilities
- None.

## Impact

- Affects the web app shell layout and contextual help widget rendering.
- Affects app shell and/or widget tests for role-aware visibility.
- No API, database, realtime, or dependency changes expected.

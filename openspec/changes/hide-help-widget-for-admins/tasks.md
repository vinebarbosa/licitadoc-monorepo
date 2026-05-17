## 1. Role-Aware Rendering

- [x] 1.1 Read the authenticated role from the existing auth session hook in the app shell layout.
- [x] 1.2 Render `ContextualHelpWidget` only when the authenticated role is not `admin`.
- [x] 1.3 Preserve current app shell rendering, sidebar, header, document editor workspace behavior, and non-admin widget behavior.

## 2. Regression Coverage

- [x] 2.1 Update app shell layout tests to provide deterministic auth session roles.
- [x] 2.2 Add coverage that `member` users still see the contextual help widget.
- [x] 2.3 Add coverage that `organization_owner` users still see the contextual help widget.
- [x] 2.4 Add coverage that `admin` users do not see the contextual help widget.
- [x] 2.5 Keep or update coverage that routes outside the app shell do not render the widget.

## 3. Verification

- [x] 3.1 Run the focused app shell layout test suite.
- [x] 3.2 Run the web typecheck or the smallest available equivalent verification for the touched files.
- [ ] 3.3 Verify in the browser when an authenticated admin session is available that the floating widget no longer appears over `/admin/chamados`.

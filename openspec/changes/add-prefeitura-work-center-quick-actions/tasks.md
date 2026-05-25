## 1. Central Quick Actions

- [x] 1.1 Add prefeitura quick action metadata in `AppHomePage` with labels, icons, descriptions, and `/app/organizacao?tab=...` targets for data, members, departments, and institutional documents.
- [x] 1.2 Read `role` and `organizationId` from `useAuthSession` in `AppHomePage` and render the prefeitura quick action group only for `organization_owner` actors with an organization id.
- [x] 1.3 Keep the existing document quick action cards, process summary, loading state, empty state, and error state unchanged while adding the new section.
- [x] 1.4 Confirm member and admin sessions do not render owner-only `/app/organizacao` quick action links.

## 2. Organization Workspace Deep Links

- [x] 2.1 Update `OwnerOrganizationWorkspace` to initialize the active tab from the `tab` query parameter.
- [x] 2.2 Normalize invalid or missing `tab` query values to the default `dados` tab without throwing.
- [x] 2.3 Update the URL query parameter whenever the user changes organization workspace tabs.
- [x] 2.4 Ensure Central de Trabalho quick action links land on the intended organization tab after navigation and refresh.

## 3. Verification

- [x] 3.1 Extend `AppHomePage` tests to cover owner-visible prefeitura actions and member/admin-hidden owner actions.
- [x] 3.2 Extend organization workspace tests to cover valid tab query activation, invalid tab fallback, and URL updates on tab changes.
- [x] 3.3 Run the focused web test suites for the app home page and owner organization workspace.

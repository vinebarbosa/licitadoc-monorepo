## Context

The owner organization route exists at `/app/organizacao`, but `OwnerOrganizationWorkspace` still renders a placeholder. The approved v0 chat `dBy5w4jPvHh` contains a complete `/organizacao` prototype with a sidebar plus a main organization workspace. This change implements only the main workspace content because the real app already provides its own authenticated sidebar and shell.

The requested version must not call backend APIs yet. Existing production adapters for organization, members, departments, and document uploads remain available for later wiring, but this iteration should mirror the v0 interaction model with local mock data and local component state.

## Goals / Non-Goals

**Goals:**
- Reproduce the v0 main organization UI in `apps/web/src/modules/organizations/ui/owner-organization-workspace.tsx`.
- Include the v0 overview header, stats, tabs, forms, member/invite list, department form/list, and document upload previews, with the reviewed refinements requested in the implementation pass.
- Keep all interactions local and mock-backed so the UI can be reviewed without backend dependency.
- Keep the implementation compatible with the current Vite/Tailwind app and shared app shell.

**Non-Goals:**
- Connecting any API endpoint or generated client hook.
- Persisting edits, invites, departments, or uploaded files outside browser state.
- Replacing the real app sidebar or route authorization.
- Redesigning v0 content, copy, data, or layout beyond path/import adaptations required by this repo.

## Decisions

### Keep the v0 content in the owner organization workspace
The v0 prototype splits the experience across several files, but this implementation will colocate the mock data and tab components in the current workspace file. This keeps the requested change tightly scoped to the file named by the user and avoids creating module boundaries that may change when API wiring happens.

Alternative considered: copy the v0 file tree into the app. Rejected for this step because the user asked for implementation in the existing workspace component and only the main content is needed.

### Use local state for all interactions
Profile edits, invite creation/cancelation, member removal, department creation/edit/delete, and upload previews will use `useState` and object URLs. This mirrors the v0 demo and makes the no-API constraint explicit.

Alternative considered: keep the existing API-backed organization tests and hooks. Rejected because the user explicitly asked not to connect the API yet.

### Preserve the app shell and omit the v0 sidebar
The real `/app/organizacao` route already lives inside `AppShellLayout`, which owns navigation and sidebar behavior. The workspace should therefore render the v0 `OrgPage` content only.

Alternative considered: port the v0 sidebar as part of the component. Rejected because it would duplicate authenticated shell navigation and contradict the request to exclude the sidebar.

### Apply review refinements from the running UI
The local app shell already provides the page breadcrumb, so the inner v0 breadcrumb is omitted. The top workspace content and tabs share the same constrained container as the main tab body. The v0 completude block is removed, the extra divider between header and tabs is removed, the invite count badge uses design-system semantic tokens, and the authority maximum data is shown in the prefeitura summary line instead of as a separate stat card.

## Risks / Trade-offs

- [The route may show the real app shell header above the v0 content] -> Keep the workspace content faithful to v0 and leave shell behavior unchanged unless a later task asks to make `/app/organizacao` immersive.
- [Mock data can diverge from real API contracts] -> Keep API wiring out of scope and document that this is a local demo state to be replaced later.
- [Large single-file component is harder to maintain] -> Accept temporarily to match the requested target file; split into smaller files when backend integration starts.

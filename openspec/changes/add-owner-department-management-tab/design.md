## Context

The backend already has the department contract needed for the requested workflow. `organization_owner` actors can list departments scoped to their organization and create new departments without submitting an explicit `organizationId`; the API infers the organization from the actor. The generated frontend client already exposes the corresponding department hooks.

The current owner administration surface is `/app/membros`. It is owner-only and currently focuses on member listing, member invites, and allowed member actions. The requested change fits naturally as a second tab on this page because departments are part of the same organization setup/admin workflow, but departments should still have their own frontend module boundary instead of being folded into user/invite code.

## Goals / Non-Goals

**Goals:**
- Add a Departments tab to the owner administration page while preserving the current members workflow as the default experience.
- Let organization owners list same-organization departments and create a new department from the web app.
- Use the existing department API contract and generated client hooks, including the API's owner-scope rules.
- Provide clear loading, empty, error, success, validation, and conflict feedback for the department workflow.
- Keep frontend code aligned with the existing modular architecture and shared UI primitives.

**Non-Goals:**
- Adding department deletion; the backend route explicitly keeps deletion out of scope.
- Adding department editing in this first version, even though the backend supports update.
- Changing department persistence, scope rules, or API route schemas unless implementation finds a contract mismatch.
- Moving member administration to a new route.

## Decisions

### Keep `/app/membros` and add tabs instead of creating a new departments route
The owner page will remain at `/app/membros` and render two tabs: Members and Departments. Members stays the default tab so existing navigation and expectations continue to work.

Rationale:
- The user asked for the department creation entrypoint inside the member administration area.
- This avoids adding another sidebar destination for a closely related owner setup task.
- The current owner-only route guard can continue protecting the whole administration surface.

Alternatives considered:
- Add `/app/departamentos`: rejected for v1 because it splits a small organization-admin workflow and requires more navigation/routing surface than needed.
- Reuse the process creation page to create missing departments inline: rejected because department setup should be reusable before any process exists.

### Introduce a departments frontend module and consume it from the owner page
Department data hooks, form mapping, labels, and the tab UI will live under `apps/web/src/modules/departments`, with public exports consumed by the existing users page.

Rationale:
- The frontend architecture treats modules as product workflow boundaries, and departments are their own domain.
- This keeps the users module focused on users/invites while allowing the owner page to compose organization-admin tabs.
- Future department edit/delete/list enhancements can evolve without bloating the user-management module.

Alternatives considered:
- Put all department tab code inside `modules/users`: rejected because it would mix department and user concerns and make later department workflows harder to locate.
- Create a generic organization-admin module first: rejected because only one page needs composition today and a broader abstraction would be premature.

### Use generated department hooks with a thin owner adapter
The frontend will wrap `useGetApiDepartments` and `usePostApiDepartments` in owner-facing adapter hooks that set standard pagination, invalidate department queries after create, and hide generated endpoint names from UI components.

Rationale:
- Existing web modules already use module-level adapters over `@licitadoc/api-client`.
- The backend already enforces owner scope, so the UI should not duplicate organization authorization logic.
- Query invalidation keeps the process creation department picker aligned after a department is created.

Alternatives considered:
- Handwrite fetch calls: rejected because project convention uses the generated client.
- Add a custom backend aggregate endpoint: rejected because listing and creation already exist and are correctly scoped.

### Auto-generate the slug from the department name while allowing user review
The create form will collect the API-required fields and auto-fill `slug` from `name` until the user edits the slug manually.

Rationale:
- The backend requires `slug`, but owners should not have to know a technical identifier before creating a department.
- Showing the slug keeps the contract explicit and allows correction for duplicate or unusually named departments.

Alternatives considered:
- Hide the slug entirely and derive it only on submit: rejected because duplicate-slug errors would feel harder to understand.
- Require manual slug entry from the start: rejected because it adds friction to a routine setup task.

## Risks / Trade-offs

- [Tabs make `/app/membros` broader than its current label] -> Keep "Membros" as the sidebar label for now if desired, but update page heading/copy to "Administração da Organização" so the Departments tab does not feel misplaced.
- [Department create conflicts can come from slug or budget unit code uniqueness] -> Surface backend error messages when available and keep the dialog open so the owner can fix the data.
- [Generated client contracts may already be sufficient but tests may need new MSW handlers] -> Add focused fixtures and handlers for `GET /api/departments/` and `POST /api/departments/`.
- [Future edit/delete requests could pressure the first UI] -> Design the table actions area conservatively, but keep v1 scoped to list and create.

## Migration Plan

No data migration is required. The change can ship as a frontend-only capability using existing department APIs. If implementation discovers that generated client types are stale, regenerate `@licitadoc/api-client` from the existing OpenAPI contract before wiring the UI.

Rollback is low risk: remove the Departments tab/module entrypoint and related tests. Existing member administration, process creation, and backend department APIs remain unchanged.

## Open Questions

None. The first version will use local tab state with Members as the default tab; URL-addressable tabs can be added later if the workflow needs shareable deep links.

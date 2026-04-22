## Context

`apps/api` is the backend package that wires Fastify, Better Auth, Drizzle, OpenAPI generation, and the domain modules for auth, invites, users, organizations, departments, processes, and documents. The implementation is already structured, but contributors currently have to infer architecture and workflow rules directly from files such as `src/app/build-app.ts`, the plugin layer, route modules, database schema, and the test setup.

The requested change is documentation-focused: it should add one operational guide for agents and contributors plus one architecture guide that maps how the API is assembled today. Because the content spans bootstrap, plugins, modules, shared auth/helpers, database boundaries, scripts, and tests, it benefits from a design pass before implementation so the future docs stay scoped and useful.

## Goals / Non-Goals

**Goals:**
- Add `apps/api/agents.md` as a practical working guide for contributors and coding agents operating inside the API package.
- Add `apps/api/architecture.md` as a current-state architecture reference for the backend package.
- Keep both guides grounded in actual source files, commands, and extension points that exist in the repository today.
- Make it easier to understand where to add routes, schemas, service logic, database changes, scripts, and tests without reverse-engineering the whole package.
- Reduce accidental architecture drift by documenting boundaries and preferred change paths close to the API code.

**Non-Goals:**
- Changing any production API contract, authorization rule, plugin order, or database schema.
- Replacing existing source comments, tests, or OpenAPI output as the canonical executable truth.
- Writing exhaustive product documentation for every endpoint.
- Introducing a large docs site or external documentation tooling.

## Decisions

### Decision: Place both documents directly under `apps/api/`
The guides should live in the package root as `apps/api/agents.md` and `apps/api/architecture.md` so they stay physically close to the code they describe and are easy to discover when someone starts work inside that package.

Alternatives considered:
- Put the guides in the repository root.
  Rejected because the content is package-specific and would be noisier outside the API package.
- Create a nested `apps/api/docs/` tree.
  Rejected because the requested scope is small and the extra nesting would make discovery slower.

### Decision: Make `agents.md` an operational playbook instead of a generic contributor overview
The agent-focused document should answer the questions that come up during active work: which commands to run, how the package is laid out, where to make different kinds of changes, which tests to run, and what architectural boundaries to respect.

Alternatives considered:
- Write a high-level narrative overview only.
  Rejected because contributors and agents usually need task-oriented guidance while editing code.

### Decision: Organize `architecture.md` around runtime flow and code boundaries
The architecture guide should describe the API from entrypoint to request handling: app bootstrap, plugin registration, route modules, authorization helpers, database layer, OpenAPI generation, and test strategy. This makes the doc useful for both onboarding and change planning.

Alternatives considered:
- Organize the architecture guide purely by folder tree.
  Rejected because folder listings alone do not explain how requests move through the system.

### Decision: Reference canonical source files throughout both documents
The documents should explicitly point to current implementation anchors such as `src/app/build-app.ts`, `src/plugins/*`, `src/modules/*`, `src/db/*`, and the Vitest test entrypoints. This keeps the docs falsifiable and reduces the risk of vague or outdated guidance.

Alternatives considered:
- Keep the docs conceptual and avoid file references.
  Rejected because abstract documentation drifts faster and is less actionable during implementation.

### Decision: Keep the docs focused on current-state guidance, with optional light discoverability from the root README
The primary deliverable is the two API-local documents. If the implementation phase determines that contributors would miss them otherwise, a lightweight link from the repository README is acceptable, but the change should not grow into a broader documentation reorganization.

Alternatives considered:
- Require a repo-wide documentation reshuffle.
  Rejected because it expands scope beyond the requested API guides.

## Risks / Trade-offs

- [Documentation can drift from code over time] -> Anchor sections to concrete files, commands, and boundaries that reviewers can verify during future edits.
- [The guides may become too verbose to be useful during active work] -> Keep `agents.md` task-oriented and keep `architecture.md` scoped to the current runtime structure.
- [Lowercase `agents.md` is less conventional than `AGENTS.md`] -> Preserve the user-requested filename for now and document its intent clearly inside the change.
- [Optional README linking could expand scope] -> Treat discoverability updates as secondary and only include them if they remain lightweight.

## Migration Plan

Add the new documentation files under `apps/api/`, review them against the current backend structure, and optionally add a lightweight discovery link from the repository README. No runtime rollout, data migration, or rollback plan is required because the change is documentation-only.

## Open Questions

No open questions at this time.

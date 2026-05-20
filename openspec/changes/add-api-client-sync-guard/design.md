## Context

The API package already exposes `generate:openapi`, and `@licitadoc/api-client` already exposes `generate`. The web app consumes that generated client from the same monorepo, so API contract changes, generated client changes, and frontend usage can live in a single branch and commit.

Remote CI/build checks would catch stale generated artifacts, but they would also add extra time to the deploy loop while the API and frontend deployment strategy is still being tuned. The first guard should therefore run locally before push, where it prevents most mistakes without slowing Vercel or GitHub.

## Goals / Non-Goals

**Goals:**
- Provide a single command that regenerates the OpenAPI document and API client in the correct order.
- Add a local pre-push hook that runs that command and blocks pushes when generated artifacts changed but were not committed.
- Keep the hook easy to install for existing clones and easy to bypass intentionally with normal Git mechanisms.
- Avoid adding a GitHub Actions or Vercel CI validation step in this change.

**Non-Goals:**
- Do not deploy the API or frontend.
- Do not change API route behavior or the generated client contract itself.
- Do not add remote CI/CD enforcement yet.
- Do not require generated artifacts to be regenerated before every individual commit.

## Decisions

### Use pre-push instead of pre-commit

The hook will run at `pre-push` time. This catches stale generated artifacts before code reaches GitHub/Vercel while avoiding extra latency on every small commit.

Alternative considered: `pre-commit`. Rejected because OpenAPI/client generation can touch many files and make frequent local commits feel heavy.

### Add explicit root scripts for generation and verification

The root package should expose scripts such as:

- `contracts:generate`: runs API OpenAPI generation, then API client generation.
- `contracts:check`: runs generation and fails if `apps/api/openapi` or `packages/api-client` have uncommitted changes.

Keeping this in package scripts makes the hook small and gives developers a command they can run manually before pushing.

Alternative considered: put all logic directly in the hook. Rejected because hook-only logic is harder to discover, test manually, or reuse later if CI validation is added.

### Keep hook management lightweight

The repository should provide a committed hook script or hook setup script that installs a `pre-push` hook under `.git/hooks`. The implementation should avoid a new hook framework unless the codebase already adopts one during implementation.

Alternative considered: add Husky. Deferred because a simple hook is enough for one local guard and avoids adding extra moving parts.

## Risks / Trade-offs

- [Risk] Local hooks can be skipped with `--no-verify` or may not be installed in every clone. → Mitigation: document setup and keep the guard available as a manual `contracts:check` command.
- [Risk] Generation can still feel slow before pushes. → Mitigation: use `pre-push` rather than `pre-commit`, and keep CI out of scope for now.
- [Risk] Generated output may change because of formatting/tooling differences. → Mitigation: rely on the repo's pinned pnpm lockfile and existing generator packages.

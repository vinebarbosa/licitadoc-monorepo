## Context

The expense-request PDF upload flow now depends on a very specific database state to work locally: an organization whose CNPJ matches the SD, at least one department whose `budgetUnitCode` and name match the SD budget unit, and a user who can authenticate and create a process within that organization scope. Right now that setup is manual, error-prone, and easy to get subtly wrong.

The reference `SD.pdf` supplied for this change already gives us the important compatibility data:

- organization name: `MUNICIPIO DE PUREZA`
- organization CNPJ: `08.290.223/0001-42`
- budget unit: `06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer`
- responsible person: `MARIA MARILDA SILVA DA ROCHA`
- source reference derived by the parser: `SD-6-2026`

The seed should use these extracted values as deterministic constants in the repo. It should not depend on reading `/Users/vine/Downloads/SD.pdf` at seed execution time, because that path is user-local and not portable.

## Goals / Non-Goals

**Goals:**

- Add a repeatable local seed command for manual testing of the SD PDF upload flow.
- Provision one organization and one department that match the real SD data closely enough for the parser and department resolution logic to succeed.
- Provision at least one sign-in-capable user scoped to that organization.
- Make the seed idempotent so it can be rerun safely during development.
- Print or document the seeded credentials and identifying values needed to test the upload route quickly.

**Non-Goals:**

- General-purpose fixture management for every business module.
- Test-only HTTP routes.
- Reading arbitrary SD PDFs at seed runtime.
- Creating a stored process or document ahead of the upload; the point is to let the upload create the process.
- Production data loading or deployment seeding.

## Decisions

### Decision: Add a dedicated development seed script under `apps/api/src/scripts`

Implement a dedicated script such as `src/scripts/seed-expense-request-upload.ts` and expose it through `package.json`. This keeps the workflow explicit and narrow, rather than overloading migrations or a generic catch-all seed command that the project does not have yet.

Alternatives considered:

- Put the logic inside a database migration.
  Rejected because this is development/test data, not schema evolution.
- Reuse E2E helper files directly.
  Rejected because helpers are test-oriented and not meant to be the public local-dev entrypoint.

### Decision: Provision auth-capable users through the application auth layer, not raw password inserts

Use the same app/bootstrap + Better Auth path already used by `create-admin.ts` and the E2E actor helpers to create a real user account, then promote/update its role and `organizationId` directly in the database. This ensures the seeded credentials can actually sign in without reverse-engineering Better Auth password storage.

Alternatives considered:

- Insert directly into `users` and `accounts`.
  Rejected because password/account hashing and provider-specific auth records should remain owned by Better Auth.
- Seed only organization/department data and tell developers to create a user manually.
  Rejected because it leaves the most annoying part of the setup unresolved.

### Decision: Seed one scoped organization-owner user by default

Create a known local user with deterministic email/password and attach it to the Pureza organization as `organization_owner`. That role is sufficient for creating departments/processes and testing the upload flow inside the correct organization scope. Optionally, the implementation may also seed a `member` variant later, but the owner account should be the default documented path.

Alternatives considered:

- Seed only an admin.
  Rejected because the upload flow should also be easy to test under the organization-scoped path that real users will likely use.
- Seed both admin and member as mandatory fixtures.
  Deferred because one well-documented happy-path account is enough for the first seed.

### Decision: Make the seed idempotent by upserting or reusing known records

Use fixed slugs/emails for the seeded records and implement the script so reruns reuse or update the same organization, department, and user instead of creating duplicates. The script should converge local state toward the desired fixture shape.

Alternatives considered:

- Always insert new random records.
  Rejected because repeated manual testing would pollute the local database and make it harder to know which records match the SD.

### Decision: Encode the reference SD values as curated constants, not a runtime PDF dependency

The implementation should copy the relevant extracted values into the seed script as explicit constants and maybe document that they came from the reference `SD.pdf`. This keeps the command deterministic, portable, and independent from the developer's downloads folder.

Alternatives considered:

- Parse the PDF every time the seed runs.
  Rejected because the file path is machine-local and the seed only needs a stable, already-known compatibility snapshot.

## Risks / Trade-offs

- [Seed credentials could leak into non-local environments] -> Scope the script and docs clearly to local development, with obvious test-only email/password values.
- [The reference SD can evolve while the seed constants stay frozen] -> Document the source PDF version/date in the script or README and keep the seed intentionally tied to this known upload fixture.
- [Idempotent updates may overwrite local ad hoc edits to the same seeded records] -> Use clearly named slugs/emails so the fixture namespace is obvious and collisions are intentional.
- [Seeding through app bootstrap can be slower than raw SQL] -> Accept the small cost because correctness of auth credentials matters more than speed here.

## Migration Plan

1. Add the seed script and package command.
2. Provision or reuse the fixture user through Better Auth and promote it to `organization_owner`.
3. Upsert the Pureza organization and matching department with `budgetUnitCode` `06.001`.
4. Print/document the seeded credentials and the expected test file path/command for manual upload.

Rollback can simply stop using the seed script or remove the seeded records manually by slug/email if needed. No schema migration is required.

## Open Questions

- Should the implementation also print a ready-made `curl` example for uploading the reference `SD.pdf`, or is documenting the credentials enough?

## Why

The new SD PDF upload flow is ready, but local manual testing still depends on setting up an organization, a department with the correct `budgetUnitCode`, and an authenticated scoped user by hand. A dedicated seed will remove that setup friction and make the upload flow reproducible with data that actually matches the reference `SD.pdf`.

## What Changes

- Add a repeatable local development seed for the expense-request PDF upload scenario.
- Seed an organization compatible with the reference SD PDF, using the extracted CNPJ and municipality identity from `SD.pdf`.
- Seed at least one department compatible with the same SD PDF, including `budgetUnitCode` `06.001` and the matching budget-unit name/responsible fields.
- Seed an authenticated local test user tied to that organization, so the seeded environment can call `POST /api/processes/from-expense-request/pdf` without extra manual role wiring.
- Document the seeded credentials/records and how to rerun the seed safely.

## Capabilities

### New Capabilities
- `expense-request-upload-dev-seed`: Covers repeatable local seed data and credentials required to manually test SD PDF upload against a realistic organization/department/user setup.

### Modified Capabilities

## Impact

- Affected code: new seed script(s) under `apps/api/src/scripts`, possible package scripts, and local developer documentation.
- Affected systems: local database contents and Better Auth-backed user provisioning for development environments.
- Affected reference data: the seed will codify values derived from the provided `SD.pdf`, including `MUNICIPIO DE PUREZA`, CNPJ `08.290.223/0001-42`, and budget unit `06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer`.
- No API contract changes are required; this is developer tooling to make the existing upload flow easier to exercise.

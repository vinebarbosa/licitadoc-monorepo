## 1. Seed Command Foundations

- [x] 1.1 Add a dedicated local seed script and package command for the expense-request upload fixture
- [x] 1.2 Encode the reference `SD.pdf` compatibility data as deterministic seed constants, including the Pureza organization identity and department budget-unit mapping

## 2. Fixture Provisioning

- [x] 2.1 Provision or reuse a sign-in-capable local user through Better Auth and promote it to an organization-scoped role tied to the seeded organization
- [x] 2.2 Upsert the Pureza organization and the matching `06.001` department so the SD PDF upload flow resolves organization and department successfully
- [x] 2.3 Make the seed idempotent so reruns update or reuse the same records instead of creating duplicates

## 3. Developer Guidance

- [x] 3.1 Document the seeded credentials, organization/department identifiers, and the recommended manual flow for testing `POST /api/processes/from-expense-request/pdf`

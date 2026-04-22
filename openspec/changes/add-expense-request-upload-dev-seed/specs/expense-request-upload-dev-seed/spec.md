## ADDED Requirements

### Requirement: Expense-request upload dev seed MUST provision compatible organization and department data
The system MUST provide a repeatable local development seed that creates or reuses organization and department records compatible with the reference SD upload fixture. The seeded department MUST be resolvable by the same budget-unit data that the SD parser extracts.

#### Scenario: Seed provisions Pureza-compatible organization and department
- **WHEN** a developer runs the expense-request upload seed command in a local environment
- **THEN** the system creates or reuses an organization with CNPJ `08.290.223/0001-42` and a department with budget unit code `06.001` that matches the SD fixture

#### Scenario: Seed is rerun
- **WHEN** a developer runs the same seed command again
- **THEN** the system reuses or updates the same fixture records instead of creating duplicates

### Requirement: Expense-request upload dev seed MUST provision a sign-in-capable scoped user
The development seed MUST provision at least one user who can authenticate locally and exercise the SD PDF upload route within the seeded organization scope.

#### Scenario: Seed provisions organization-scoped upload actor
- **WHEN** the expense-request upload seed completes successfully
- **THEN** the seeded environment contains at least one documented local user with valid credentials and an organization-scoped role tied to the seeded organization

### Requirement: Expense-request upload dev seed MUST surface the fixture details needed for manual testing
The development seed MUST tell the developer which credentials and reference records were prepared so the upload flow can be exercised without further database inspection.

#### Scenario: Seed reports manual-test fixture details
- **WHEN** the seed command finishes
- **THEN** it outputs or documents the seeded email, role, organization identity, and department budget-unit reference needed to test SD PDF upload manually

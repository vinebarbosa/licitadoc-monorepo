## ADDED Requirements

### Requirement: Admins can view AI monetary usage
The system SHALL provide an admin-only AI usage dashboard that summarizes document-generation AI spend in USD, generated document volume, token consumption, average cost per completed document, cache-related token usage, and failure rate for a selected period.

#### Scenario: Admin opens the AI usage dashboard
- **WHEN** an authenticated `admin` opens the AI usage dashboard
- **THEN** the system displays monetary and usage summary metrics for the default period

#### Scenario: Non-admin attempts to open the dashboard
- **WHEN** an authenticated actor without the `admin` role requests the AI usage dashboard or its backing API
- **THEN** the system rejects access with the existing unauthorized behavior

### Requirement: Dashboard metrics can be filtered
The system SHALL allow admins to filter AI usage metrics by date range, organization, provider, model, document type, and generation status. The selected filters MUST be reflected in the page URL and in the API query used to load the dashboard data.

#### Scenario: Admin filters by period and model
- **WHEN** an admin selects a custom date range and a model filter
- **THEN** the dashboard reloads all summary, chart, breakdown, and run-table data using those filters

#### Scenario: Admin refreshes a filtered dashboard
- **WHEN** an admin refreshes the page while filters are present in the URL
- **THEN** the dashboard restores those filters and requests matching data

### Requirement: Dashboard exposes cost trend and breakdowns
The system SHALL show a cost trend over time and grouped breakdowns by model, provider, document type, organization, and status. Breakdowns MUST include spend, run count, token totals, and a percentage share when totals are known.

#### Scenario: Admin reviews cost trend
- **WHEN** an admin opens the dashboard for a period with completed generation runs
- **THEN** the dashboard displays a time-series visualization of daily or period-appropriate spend and run volume

#### Scenario: Admin reviews model breakdown
- **WHEN** dashboard data includes more than one model
- **THEN** the dashboard displays each model with its spend, run count, token use, and share of known spend

### Requirement: Dashboard lists AI generation runs
The system SHALL provide a paginated table of AI generation runs that includes document name, process context when available, organization, document type, provider, model, status, started/finished time, duration, token totals, and cost status.

#### Scenario: Admin inspects recent runs
- **WHEN** an admin opens the run table
- **THEN** the table shows recent generation runs with monetary cost when known and an explicit unknown-cost indicator when cost cannot be calculated

#### Scenario: Admin changes table page
- **WHEN** an admin moves to another run-table page
- **THEN** the system requests the next page without changing the selected dashboard filters

### Requirement: Dashboard handles operational states
The system SHALL provide polished loading, empty, and error states consistent with the existing admin interface.

#### Scenario: Dashboard data is loading
- **WHEN** the AI usage request is pending
- **THEN** the interface shows skeleton states for metrics, chart, breakdowns, and table without layout shift

#### Scenario: No usage exists for filters
- **WHEN** the selected filters match no generation runs
- **THEN** the interface shows an empty state that explains no AI usage was found for the selected filters

#### Scenario: Dashboard request fails
- **WHEN** the AI usage request fails
- **THEN** the interface shows an error state with a retry affordance

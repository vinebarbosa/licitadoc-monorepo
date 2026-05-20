## ADDED Requirements

### Requirement: Shared skeleton loaders MUST use neutral loading color
The web design system MUST render shared skeleton loading placeholders with a neutral gray visual treatment rather than primary, accent, sidebar-primary, status, or other blue-tinted brand tokens. The neutral treatment MUST work in light and dark themes and MUST preserve the existing skeleton animation, rounded geometry, and caller-provided sizing classes.

#### Scenario: Shared skeleton renders as a neutral placeholder
- **WHEN** a product module renders the shared `Skeleton` primitive during loading
- **THEN** the visible placeholder uses a neutral gray loading color
- **AND** it does not use the primary or accent blue color tokens for its background

#### Scenario: Table loading states inherit the shared neutral skeleton
- **WHEN** a table-based page such as processes, documents, departments, or users renders a loading state with shared skeleton cells
- **THEN** the skeleton bars appear as subtle neutral placeholders
- **AND** the page does not need per-table color overrides to avoid blue skeleton bars

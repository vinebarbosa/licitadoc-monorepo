## ADDED Requirements

### Requirement: Process table MUST constrain long text columns
The web processes listing table MUST keep a stable width within the available page content area when process names or other text values are longer than the visible column space.

#### Scenario: Process name is longer than the available name column
- **WHEN** an authenticated actor opens `/app/processos` and a listed process has a name longer than the visible name column
- **THEN** the process table remains constrained to the available content width
- **THEN** the process name cell renders the visible value on a single line with an ellipsis
- **THEN** the remaining process columns remain visible without being pushed off-screen by the long name

### Requirement: Process name tooltip MUST expose the full truncated value
The web processes listing table MUST expose the complete process name in a tooltip when the user hovers over the truncated name long enough for the standard tooltip delay.

#### Scenario: User hovers a truncated process name
- **WHEN** an authenticated actor hovers over a truncated process name and waits for the tooltip delay
- **THEN** the page displays a tooltip containing the complete process name
- **THEN** the process name remains a link to the process detail route

#### Scenario: Process name fits in the visible column
- **WHEN** a listed process name fits within the visible name column
- **THEN** the page still renders the process name as the process detail link
- **THEN** the table layout remains stable with the same column sizing rules

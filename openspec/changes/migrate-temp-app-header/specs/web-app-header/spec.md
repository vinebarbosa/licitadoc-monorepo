## ADDED Requirements

### Requirement: Protected app shell header MUST render navigation context
The protected app shell header MUST render inside the supported `apps/web` app-shell architecture and MUST provide the current navigation context without importing runtime code from `tmp`.

#### Scenario: Header renders with breadcrumbs
- **WHEN** an authenticated app route provides breadcrumbs to the app shell header
- **THEN** the header renders the sidebar trigger and the breadcrumb trail
- **AND** intermediate breadcrumb entries link to their configured destinations
- **AND** the final breadcrumb entry renders as the current page

#### Scenario: Header renders with title fallback
- **WHEN** an authenticated app route provides a title and no breadcrumbs
- **THEN** the header renders the sidebar trigger and the title text

### Requirement: Protected app shell header MUST expose notifications action
The protected app shell header MUST include a notification icon button aligned with the header actions.

#### Scenario: User inspects header actions
- **WHEN** the protected app shell header is rendered
- **THEN** a button labelled for notifications is available
- **AND** the button visually includes the notification icon and unread-count badge affordance

### Requirement: Protected app shell header MUST toggle between light and dark mode
The protected app shell header MUST include a single control that toggles the current web app theme between light and dark using the existing app theme provider.

#### Scenario: User toggles the theme from the header
- **WHEN** the user activates the header theme toggle
- **THEN** the app switches between light and dark mode through the existing theme context
- **AND** the selected theme remains persisted by the existing theme provider behavior

#### Scenario: User views the current theme affordance
- **WHEN** the protected app shell header is rendered
- **THEN** the theme toggle presents a sun or moon affordance that reflects the current light or dark mode

### Requirement: Protected app shell header MUST omit search
The protected app shell header MUST NOT render a process or document search input.

#### Scenario: User opens any protected app shell route
- **WHEN** the app shell header is rendered
- **THEN** no header search textbox is present
- **AND** route header metadata does not need a search visibility flag

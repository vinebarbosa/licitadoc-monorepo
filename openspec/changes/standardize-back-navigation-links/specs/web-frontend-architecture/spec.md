## ADDED Requirements

### Requirement: Authenticated app pages MUST use the standard page back affordance
Authenticated web app pages that expose a top-level page-exit back control MUST render that control with the standard page back affordance: a left arrow icon followed by the visible label `Voltar`, placed near the top of the page content before the primary page heading or body. The control MUST preserve the page's intended navigation target or history callback.

#### Scenario: Link-based page back control
- **WHEN** an authenticated app detail, create, or edit page has a fixed parent route for returning to the previous workflow list or detail page
- **THEN** the page renders a link with accessible name `Voltar`
- **AND** the link uses the approved arrow-left + `Voltar` presentation
- **AND** the link points to the same logical parent route that the page previously used

#### Scenario: History-based page back control
- **WHEN** an authenticated app page intentionally returns to the previous in-app history entry
- **THEN** the page renders a button with accessible name `Voltar`
- **AND** the button uses the approved arrow-left + `Voltar` presentation
- **AND** activating the button preserves the existing history-aware behavior

#### Scenario: Non-page navigation controls stay specific
- **WHEN** a control is a wizard step navigation button, form cancellation action, auth-page login link, modal/drawer control, or failure-state recovery action
- **THEN** the control is not required to use the standard page back affordance
- **AND** the control may keep destination-specific copy when that copy clarifies the action

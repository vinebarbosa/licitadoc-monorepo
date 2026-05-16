## ADDED Requirements

### Requirement: Authenticated users MUST have a floating help entry point
The authenticated web experience SHALL render a floating help entry point that remains available across app-shell product workflows without being added separately by each page.

#### Scenario: User views an authenticated app page
- **WHEN** an authenticated user opens an app-shell product page
- **THEN** the system displays a floating help trigger in a consistent viewport position
- **AND** the trigger has an accessible name that communicates that it opens help

#### Scenario: User views a non-app-shell route
- **WHEN** a user opens a public, sign-in, recovery, or onboarding-only route outside the authenticated app shell
- **THEN** the system does not display the floating help widget by default

### Requirement: Help trigger MUST communicate availability without distracting from work
The collapsed help trigger SHALL use a discreet visual treatment, recognizable help or chat iconography, keyboard focus styling, and an availability indicator.

#### Scenario: Widget is collapsed
- **WHEN** the widget is not expanded
- **THEN** the trigger displays a help or chat icon and availability signal
- **AND** the trigger remains visually secondary to primary page actions

#### Scenario: Keyboard user focuses the trigger
- **WHEN** a keyboard user tabs to the collapsed trigger
- **THEN** the system shows a visible focus state
- **AND** pressing Enter or Space opens the widget

### Requirement: Expanded widget MUST provide trustworthy help controls
The expanded widget SHALL show a clear header, support status, close or minimize controls, conversation history, message input, and quick actions for common workflows.

#### Scenario: User opens the widget
- **WHEN** the user activates the floating help trigger
- **THEN** the system opens the widget panel
- **AND** the panel shows the LicitaDoc help identity, availability/status text, recent conversation content, a message input, and controls to close or minimize

#### Scenario: User chooses a quick action
- **WHEN** the user selects a quick action such as "Gerar documento", "Importar PDF", "Convidar membro", or "Falar com suporte"
- **THEN** the widget records the selected action in the conversation flow
- **AND** the system responds with concise guidance or the next suggested step for that action

### Requirement: Widget MUST provide contextual suggestions
The widget SHALL provide contextual suggestions based on the current authenticated route or workflow instead of showing the same generic prompts everywhere.

#### Scenario: User opens help on a process workflow
- **WHEN** the current route represents a process listing, process creation, process detail, or process editing workflow
- **THEN** the widget shows suggestions related to process data, departments, imported PDFs, deadlines, or process documents as appropriate for that route group

#### Scenario: User opens help on a document workflow
- **WHEN** the current route represents document listing, creation, generation, or preview
- **THEN** the widget shows suggestions related to generating, reviewing, adjusting, printing, or navigating documents

#### Scenario: Route has no specific mapping
- **WHEN** the current authenticated route has no dedicated help context
- **THEN** the widget falls back to general LicitaDoc assistance suggestions

### Requirement: Initial widget behavior MUST be frontend-local
The initial implementation SHALL handle conversation state, quick-action responses, contextual suggestions, typing affordances, and minimized state in the frontend without requiring a backend support API.

#### Scenario: User sends a message
- **WHEN** the user enters a message and submits it
- **THEN** the widget appends the user message to the local conversation
- **AND** the widget shows a deterministic assistant response or guidance state without making a new backend request

#### Scenario: User closes and reopens the widget
- **WHEN** the user closes the widget and opens it again during the same page session
- **THEN** the widget presents a usable local help state
- **AND** the system does not require persisted conversation data

### Requirement: Widget layout MUST remain accessible and responsive
The widget SHALL preserve readable text, usable controls, and non-overlapping placement across supported desktop and mobile viewport sizes.

#### Scenario: User opens the widget on desktop
- **WHEN** the viewport has desktop dimensions
- **THEN** the widget opens as a fixed panel near the lower end of the interface
- **AND** the panel does not cover persistent navigation or primary page controls more than necessary

#### Scenario: User opens the widget on mobile
- **WHEN** the viewport has mobile dimensions
- **THEN** the widget uses constrained sizing appropriate for the viewport
- **AND** text, buttons, input, and quick actions remain readable and reachable

#### Scenario: User relies on assistive labels
- **WHEN** assistive technology inspects widget controls
- **THEN** icon-only controls expose labels for opening, closing, minimizing, and sending help messages

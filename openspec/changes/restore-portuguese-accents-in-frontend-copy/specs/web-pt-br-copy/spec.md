## ADDED Requirements

### Requirement: Frontend must render PT-BR copy with correct accents
The web frontend SHALL display user-facing Portuguese text with correct PT-BR accentuation across authenticated routes, public demo pages, and shared UI states.

#### Scenario: Heading or label is rendered in a primary workflow
- **WHEN** a user opens a page, form step, empty state, or action area rendered by the frontend
- **THEN** visible Portuguese headings, labels, descriptions, badges, and buttons MUST use correct accentuation

#### Scenario: Feedback message is shown to the user
- **WHEN** the frontend displays a toast, inline error, success message, or fallback message in Portuguese
- **THEN** the visible message MUST use correct PT-BR accentuation

### Requirement: Technical strings must not be rewritten indiscriminately
The frontend copy review SHALL distinguish visible UI text from technical identifiers so that only user-facing Portuguese copy is normalized.

#### Scenario: A string is used only as a technical identifier
- **WHEN** a string is used as a route segment, payload field, slug, enum value, or internal identifier and is not rendered to the user
- **THEN** the change MUST NOT require that string to be rewritten for accentuation

#### Scenario: Test fixtures feed visible UI text
- **WHEN** a fixture or mocked response is rendered directly in the UI and asserted by tests
- **THEN** the rendered text MUST follow the same PT-BR accentuation rules as production UI copy

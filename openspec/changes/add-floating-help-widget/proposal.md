## Why

Users need a visible, trustworthy way to ask for help without leaving the workflow they are completing. A floating help widget gives contextual support at the moment of doubt, especially in complex flows such as document generation, PDF import, member invitation, and process management.

## What Changes

- Add a floating help widget to the authenticated web experience.
- Provide a collapsed state with a discreet help/chat entry point and availability signal.
- Provide an expanded state with a clear header, short conversation history, message input, quick actions, and contextual suggestions based on the current page or workflow.
- Establish a modern, sober, accessible visual direction that feels reliable for public procurement users.
- Use the v0 demo as a visual reference for the initial product direction.
- Keep the initial scope frontend-only, with mocked or local interaction behavior until a support backend or AI assistant contract is introduced.

## Capabilities

### New Capabilities
- `contextual-help-widget`: Defines the authenticated web help widget experience, including visibility, collapsed and expanded states, contextual suggestions, quick actions, conversation behavior, accessibility, and responsive placement.

### Modified Capabilities
- None.

## Impact

- Affected app: `apps/web`.
- Likely touched areas: app shell/composition, shared UI primitives, shared hooks, route context helpers, and focused frontend tests.
- No backend API, database, or generated API client changes are expected for the initial demo-quality implementation.
- Design reference: v0-generated demo for the trusted floating support interface.

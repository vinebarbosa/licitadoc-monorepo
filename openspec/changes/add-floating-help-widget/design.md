## Context

`apps/web` is a Vite React app organized around app composition, product modules, and shared design-system primitives. The help widget needs to be globally available inside authenticated product workflows without becoming a one-off overlay hidden inside an individual page.

The initial request is demo-oriented and includes a v0 reference for a modern, trustworthy interface. The product implementation should use that reference for interaction shape and visual tone, while adapting it to the existing React Router app, Tailwind tokens, shared UI primitives, and app-shell layout.

## Goals / Non-Goals

**Goals:**
- Add a floating help entry point to authenticated app pages.
- Support collapsed, expanded, minimized, conversation, quick-action, and contextual-suggestion states.
- Keep the visual language sober, accessible, and confidence-building for public procurement users.
- Keep initial behavior deterministic and frontend-local so the widget can ship before a support or AI backend contract exists.
- Preserve frontend architecture boundaries and testability.

**Non-Goals:**
- Build a real-time chat backend, ticketing integration, or AI assistant API.
- Persist conversations across sessions.
- Change backend routes, database schema, generated API client code, or authorization behavior.
- Show the widget on public marketing, sign-in, password recovery, or onboarding-only routes unless explicitly enabled later.

## Decisions

### Render the widget from the authenticated app shell

The widget should be composed by the authenticated app-shell layout instead of individual product pages.

- Rationale: users should receive consistent help across process, document, member, and dashboard workflows, and pages should not duplicate global overlay behavior.
- Alternative considered: add the widget separately to each page. This would create repeated state management and uneven coverage.

### Own the feature in a dedicated help module

Create a module such as `apps/web/src/modules/help` with a public export consumed by the app shell. Module internals can include widget UI, context mapping, quick actions, and local conversation state. Generic primitives still come from `apps/web/src/shared/ui`.

- Rationale: the widget is a product workflow, not a generic design-system primitive. Keeping it module-owned preserves shared UI as reusable building blocks.
- Alternative considered: place the full widget under `src/shared/ui`. That would make product-specific copy, route context, and support behavior look reusable when they are not.

### Resolve context from the current route

The first implementation should derive contextual suggestions from route/path metadata and stable workflow identifiers. Example contexts include processes, process creation, process detail, documents, document preview, member management, and home/dashboard.

- Rationale: contextual suggestions make the widget useful immediately without backend dependencies.
- Alternative considered: infer context from DOM text. That is brittle and harder to test.

### Keep interactions local and deterministic

The first version should maintain messages, typing state, quick-action responses, minimized state, and input state in the browser component tree. Responses can be canned and clearly framed as assistant guidance.

- Rationale: this supports a credible demo and a safe product first slice without promising live support.
- Alternative considered: introduce a new API abstraction now. That would create unused backend contract work before the support model is defined.

### Use accessible overlay patterns

The floating trigger should be a keyboard-focusable button with an accessible label. The expanded panel should preserve focus order, support closing/minimizing, avoid blocking the page unnecessarily, and adapt to mobile as a bottom-aligned panel with safe spacing.

- Rationale: the widget is always near the workspace and must not trap or obscure core workflows.
- Alternative considered: use a modal dialog for all states. That would overstate the widget's importance and interrupt users who only need quick guidance.

## Risks / Trade-offs

- [Risk] The widget may overlap important page actions on small screens. → Mitigate with responsive sizing, mobile bottom-panel behavior, and layout tests for representative routes.
- [Risk] Users may interpret demo responses as live support or AI-backed answers. → Mitigate with precise copy such as "Assistente do LicitaDoc" and deterministic guidance until a backend contract exists.
- [Risk] A global widget can become noisy if shown during onboarding or auth flows. → Mitigate by rendering only inside the authenticated app shell for the first slice.
- [Risk] Route-context mapping can drift as routes evolve. → Mitigate with a small model helper and unit tests that cover known route groups.

## Migration Plan

1. Add the help module with model helpers, widget UI, and public export.
2. Compose the widget into the authenticated app-shell layout.
3. Add focused tests for context selection, rendering states, quick actions, and route inclusion.
4. Validate with frontend typecheck, lint, Vitest, and targeted browser coverage if the widget is visible on navigable app routes.
5. Roll back by removing the app-shell composition and module files; no data migration is required.

## Open Questions

- Should a future version connect to an internal ticketing/support channel, an AI assistant, or both?
- Should help conversations become auditable or exportable for public-sector compliance needs?
- Which workflow should receive the first deeper contextual playbook after the demo: document generation, PDF import, or member onboarding?

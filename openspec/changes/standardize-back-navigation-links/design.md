## Context

The app shell already provides breadcrumbs for broad location context, while individual pages still render their own escape/back controls when the user is inside a detail, create, edit, or preview workflow. Those controls have drifted: process detail uses a small inline `ArrowLeft` + `Voltar` affordance, document create uses an icon-only link, document preview uses a button-style `Voltar`, and several failure states use longer recovery copy.

The desired product direction is to make page-level back navigation feel like the process detail screenshot: lightweight, predictable, and visually separate from primary page actions. This is a frontend-only visual and interaction alignment.

## Goals / Non-Goals

**Goals:**

- Standardize authenticated app page-level back controls to a shared visual pattern: inline arrow-left icon plus the text `Voltar`.
- Preserve each page's existing destination or history behavior unless the current behavior is already incorrect.
- Keep breadcrumbs in the app header unchanged; breadcrumbs and page-level back controls serve different navigation purposes.
- Update tests for pages whose visible back affordance changes.

**Non-Goals:**

- Redesign app shell breadcrumbs, sidebar navigation, or top header actions.
- Change auth/public page links such as `Voltar para o login`.
- Change wizard step navigation buttons, form cancellation buttons, modal controls, or error recovery links that intentionally communicate a specific destination.
- Add routing APIs, backend changes, or new dependencies.

## Decisions

### Decision: Introduce a small shared page-back affordance

Implement a reusable shared UI/component helper for page-level back links/buttons rather than hand-tuning classes in every page. The component should encode the approved presentation: subtle foreground/muted color, inline `ArrowLeft`, `Voltar` label, hover transition, and flexible rendering for either a React Router `Link` destination or a button callback for history-based pages.

Alternative considered: copy the process detail classes into each page. That is fast but invites drift the next time spacing, color, or accessible labeling changes.

### Decision: Treat page-level back separately from recovery/cancel actions

Only top-of-page page-exit controls should use the standardized `Voltar` affordance. Empty/error-state recovery actions may continue to say `Voltar para Processos` or `Voltar para Documentos`, because those controls clarify the recovery destination from a failure state. Wizard step `Voltar` and `Cancelar` buttons should also remain button-shaped because they operate inside form state rather than exiting the page.

Alternative considered: replace every visible "Voltar" string everywhere. That would make several controls less clear and could blur the difference between page navigation and in-flow form navigation.

### Decision: Preserve existing navigation semantics

Document preview can keep its history-aware behavior while adopting the same visual treatment. Link-based pages such as process detail and document create should keep their current parent route destinations. Implementation should avoid changing route handles or app-shell breadcrumb composition.

Alternative considered: force every page-level back to a fixed parent route. That would simplify implementation but regress preview flows where history-based back is deliberately more accurate.

## Risks / Trade-offs

- [Risk] Over-standardizing could remove useful destination copy from failure states. -> Mitigation: scope the requirement to page-level top controls and explicitly exclude recovery/cancel controls.
- [Risk] A shared component could be used in places where a button or specific label is more appropriate. -> Mitigation: document the intended use through tests and keep the component name/page placement specific.
- [Risk] History-based back pages may become less accessible if rendered as a bare icon/text button. -> Mitigation: preserve `button` semantics and accessible name `Voltar` for callback-based controls.
- [Risk] Visual changes across multiple pages can break brittle tests. -> Mitigation: update focused page tests around accessible names, hrefs/callbacks, and absence of old icon-only controls.

## Why

The admin support page exists, but the current experience still reads too much like a dashboard. The operator has metrics, panels, and a separate evidence area competing with the conversation, while the real job is closer to a mature support inbox: pick the next user, understand the context, see what they sent, and answer quickly.

User-submitted media is especially important. A screenshot is part of the conversation and should feel like something the user sent, not like an admin-only artifact detached from the message history. The page should feel trustworthy, compact, and fluid, with the chat as the center of gravity.

## What Changes

- Redesign `/admin/chamados` as a full-height support inbox instead of a dashboard-first page.
- Use the v0 async demo as the visual/UX reference and explicitly apply the LicitaDoc theme tokens:
  - `background: oklch(0.985 0.002 250)`
  - `foreground: oklch(0.2 0.02 250)`
  - `primary: oklch(0.4 0.08 230)`
  - `radius: 0.5rem`
  - dark sidebar tokens from the existing app shell
- Make the layout feel like mature support software: compact ticket queue, dominant chat thread, and a secondary context panel.
- Move screenshots, files, and other user-submitted evidence into the chat timeline as inline bubbles/previews.
- Keep support actions immediately reachable from the chat header and composer: assumir/atribuir, responder, anexar/capturar tela, resolver, reabrir, and quick replies.
- Preserve the deterministic frontend-local behavior from the first admin support implementation until a backend support API exists.
- Keep the page responsive: on constrained viewports the queue and context panel become navigable surfaces while the conversation remains primary.

v0 reference chat: https://v0.app/chat/kGSWHD07Ll3

## Capabilities

### New Capabilities
- `web-admin-support-inbox-experience`: Conversation-first admin support inbox UX for `/admin/chamados`, including compact queue behavior, inline media in chat, mature theming, fluid support actions, and responsive operator workflow.

### Modified Capabilities
- None. This change builds on the open `web-admin-support-ticket-management` work and refines its user experience without introducing a backend contract.

## Impact

- Affected frontend areas:
  - `apps/web/src/modules/support/ui/admin-support-tickets-page.tsx`
  - `apps/web/src/modules/support/model/support-tickets.ts`
  - support page tests and focused E2E coverage
- No API, database, generated client, authentication, or permission changes.
- No change to the user-facing help widget behavior except that the admin surface represents its submitted media more naturally.

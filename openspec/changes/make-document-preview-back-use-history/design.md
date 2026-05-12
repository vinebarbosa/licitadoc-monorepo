## Context

The preview page currently has a top-left back action. After fixing the broken `/app/documento/:documentId` link, the action points to `/app/documentos`. That is valid but not ideal: a user can arrive at preview from process detail, document creation, document listing, or another in-app route, and a fixed destination discards that context.

## Goals / Non-Goals

**Goals:**
- Make the preview back button behave like a true history back action.
- Keep a safe fallback to `/app/documentos` for direct page loads or missing history.
- Use generic copy (`Voltar`) that matches history-based behavior.
- Keep print/export controls and preview rendering unchanged.

**Non-Goals:**
- Create or restore a document editing route.
- Add new route definitions.
- Change breadcrumbs, document APIs, generation, or export behavior.

## Decisions

1. Use a button with `navigate(-1)` instead of a fixed `Link`.

   The action is procedural rather than a static destination. `useNavigate()` from React Router matches the desired browser-history behavior. A fixed `Link` cannot preserve the previous workflow context.

2. Fall back to `/app/documentos` when there is no useful history.

   Direct loads and external entries may not have an in-app page to return to. The implementation should detect a usable history entry when possible and otherwise navigate to `/app/documentos` with replacement to avoid looping. The exact detection can use browser history state/index when available and remain conservative.

3. Keep the label as `Voltar`.

   Because the destination depends on history, destination-specific labels such as `Voltar para documentos` or `Voltar para edição` are misleading. `Voltar` reflects the behavior without promising a route.

## Risks / Trade-offs

- Browser history state differs between test and production environments -> Keep fallback logic conservative and cover both branches in tests.
- A user arriving from an external page could be sent outside the app if raw browser back is used blindly -> Only use history back when there is evidence of an in-app history entry; otherwise go to `/app/documentos`.
- Replacing a link with a button changes semantics -> Keep it visually identical, type it as `button`, and preserve accessible label text.

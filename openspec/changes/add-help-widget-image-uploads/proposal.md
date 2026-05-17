## Why

Users can describe a support issue from the help widget, but the current screenshot card is only contextual metadata and the open chat has no way to add another image after support asks for one. Support conversations need real image attachments so users can show the blocked screen before starting a ticket and continue adding visual evidence during the chat.

## What Changes

- Add a real upload control to the support intake "Anexar captura de tela" card.
- Allow the user to attach one or more images before starting the support chat.
- Add an image attachment button to the active support chat composer so the user can send another capture after the ticket is open.
- Persist image attachment metadata with the related support ticket message instead of using only a local screenshot indicator.
- Render attached images inline in both the requester widget chat and the admin/support ticket conversation.
- Keep the validated support widget UI direction from the screenshots, using compact Portuguese labels and non-disruptive upload feedback.
- Preserve existing text-message, support-history, realtime, and requester-scoped access behavior.

## Capabilities

### New Capabilities

- `help-widget-image-attachments`: Defines image upload and rendering behavior for support ticket intake and active support chat conversations in the contextual help widget.

### Modified Capabilities

None.

## Impact

- API app: support ticket create/message schemas, attachment validation, attachment persistence, and support ticket serialization.
- Database: support ticket attachment metadata may need additional fields for image file references, MIME type, size, and display metadata.
- Web app: contextual help widget intake card, chat composer, message rendering, support API helpers/hooks, and MSW fixtures.
- Admin support UI: inline image attachment display in the persisted ticket conversation.
- Realtime: message-created events should include lightweight attachment metadata after persistence, while files remain outside Ably payloads.
- Storage: image files should be uploaded through an authorized path or storage abstraction rather than embedded in realtime messages.
- Tests: focused API tests for attachment persistence/authorization and web tests for intake upload, in-chat upload, rendering, and error states.

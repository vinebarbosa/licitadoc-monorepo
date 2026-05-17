## 1. Data Model and Attachment Contract

- [x] 1.1 Add an additive migration for support image attachment metadata, preserving existing `screenshot` attachment rows.
- [x] 1.2 Extend support attachment schema/types to represent real image attachments with storage key, MIME type, file size, and optional display URL/access metadata.
- [x] 1.3 Update support ticket serialization so message-linked image attachments are returned with the ticket detail and list data needed by widget/admin views.
- [x] 1.4 Add attachment validation helpers for accepted image MIME types, maximum file size, required name/description, and message association.

## 2. API and Realtime Behavior

- [x] 2.1 Add or wire an authorized image upload path/storage abstraction for support ticket attachments.
- [x] 2.2 Update support ticket creation to accept pending image attachment metadata and persist it with the first user message.
- [x] 2.3 Update support ticket message creation to accept image attachments, including attachment-only image messages.
- [x] 2.4 Ensure unauthorized users cannot read attachment metadata or file access information for tickets they cannot access.
- [x] 2.5 Keep Ably support events lightweight by publishing persisted message and attachment metadata only.
- [x] 2.6 Regenerate the API client after support ticket schema changes.

## 3. Help Widget UI

- [x] 3.1 Replace the intake screenshot toggle with a real image upload button using the validated "Anexar captura de tela" card styling.
- [x] 3.2 Show pending intake image previews with remove/error states before "Iniciar chat".
- [x] 3.3 Add an image attachment button to the active support chat composer without disrupting the existing text input and send button layout.
- [x] 3.4 Show pending chat image previews, allow removal before send, and allow attachment-only image messages.
- [x] 3.5 Render persisted image attachments inline in widget messages with Portuguese labels and accessible alt text.
- [x] 3.6 Preserve existing support history, realtime reconciliation, loading, retry, and text-message behavior.

## 4. Admin Support UI

- [x] 4.1 Render message-linked image attachments inline in the admin support ticket conversation.
- [x] 4.2 Ensure admin attachment previews fit the current panel without horizontal overflow or layout jumps.
- [x] 4.3 Keep existing ticket list, filters, assignment, status, read state, and realtime message behavior unchanged.

## 5. Tests and Verification

- [x] 5.1 Add API tests for ticket creation with image attachments, chat image messages, attachment-only messages, validation failures, and unauthorized access.
- [x] 5.2 Update MSW handlers and fixtures for support ticket attachments with real image metadata.
- [x] 5.3 Add widget tests for intake upload, remove, validation error, chat upload, attachment-only send, and inline rendering.
- [x] 5.4 Add admin support UI tests for inline image attachment rendering.
- [x] 5.5 Run API typecheck and focused support ticket API tests.
- [x] 5.6 Run web typecheck and focused help/admin support widget tests.

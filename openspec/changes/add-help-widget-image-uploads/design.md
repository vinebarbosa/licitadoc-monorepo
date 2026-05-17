## Context

The contextual help widget already opens persisted support tickets and sends text messages through the support ticket API. The current "Anexar captura de tela" intake card only toggles screenshot metadata; it does not upload or display a real file. The active support chat composer also only supports text, so a requester cannot answer "Pode me enviar uma captura da tela atual?" with another image inside the same conversation.

The current support ticket attachment model is intentionally small: `support_ticket_attachments` stores `type`, `name`, `description`, optional `storageKey`, and optional `messageId`, while API schemas expose only a `screenshot` metadata object. Realtime delivery already uses Ably with the application database as source of truth, so image files should not be pushed through Ably payloads.

## Goals / Non-Goals

**Goals:**

- Make the intake "Anexar captura de tela" card open a real image upload flow.
- Allow image attachments to be sent with the first support ticket message and with later chat messages.
- Persist attachment metadata in the support ticket database and associate every uploaded image with the message that introduced it.
- Render image attachments inline in requester and admin support conversations.
- Keep the validated widget UI direction from the screenshots: compact, Portuguese, clear, and not visually noisy.
- Keep realtime events lightweight by publishing message and attachment metadata after database persistence.

**Non-Goals:**

- Build a general document/file storage product for arbitrary file types.
- Send raw image bytes through Ably.
- Add audio/video attachments in this change.
- Replace the current support chat layout or admin support ticket experience.
- Add screenshot capture from the browser automatically; this change supports user-selected image uploads.

## Decisions

### Store files outside Ably and persist only attachment metadata

Uploaded images will be stored through an authorized upload path or existing storage abstraction. The support ticket tables will store metadata such as attachment type, file name, description, storage key, MIME type, size, and display information. Realtime events will include only the persisted message and attachment metadata.

Rationale: Ably is the realtime delivery channel, not the durable file store. Keeping file bytes out of Ably avoids payload limits, unnecessary bandwidth, and duplicated persistence concerns.

Alternative considered: encode images as base64 inside support messages. This was rejected because image payloads can become large quickly, complicate retries, and make the database/realtime payloads heavier than the conversation needs.

### Extend the existing support attachment model instead of creating a parallel message table

The existing `support_ticket_attachments` table already models ticket-level and message-level attachments. This change should expand it for real images instead of introducing a separate image-message concept.

Rationale: support ticket detail serialization, admin UI rendering, and widget message mapping already know how to associate attachments with messages. Extending the model keeps the feature near the existing support domain.

Alternative considered: store image URLs directly on `support_ticket_messages`. This was rejected because a message can reasonably have multiple images and because attachments already have their own lifecycle and metadata.

### Support intake and chat uploads through the same attachment pipeline

The intake upload and active-chat upload should use the same validation, upload, persistence, serialization, and rendering path. The difference is only where the attachment is introduced: ticket creation creates the first message plus attachments, while chat upload creates a new message plus attachments.

Rationale: the user sees two entry points, but the backend should treat both as support message attachments. Shared behavior reduces mismatched states between the first screenshot and later images.

Alternative considered: keep intake screenshots as metadata and only make active chat uploads real files. This was rejected because support needs the initial screenshot to be visible and useful in the same way as later images.

### Keep text messages valid while allowing attachment-only image messages

The chat composer should continue to require text for normal text sends, but an uploaded image can create a valid support message even when the text field is empty. The UI may use a short default message such as "Imagem anexada" when the user sends only an image.

Rationale: users often respond to a support request with just a screenshot. Forcing extra text would slow down the exact flow shown in the second screenshot.

Alternative considered: require a caption for every image. This was rejected as unnecessary friction for support captures.

### Keep upload UI local and reversible before send

In the intake state, selected images should be previewed near the upload card and removable before starting the chat. In the active chat, selected images should appear as pending previews near the composer and can be removed before sending.

Rationale: the user needs confidence about what will be sent to support, especially when screenshots may contain sensitive procurement or organizational context.

Alternative considered: immediately persist a file as soon as it is picked. This can work at the storage layer, but the conversation should not show the attachment as sent until the support message is created successfully.

## Risks / Trade-offs

- Uploaded images may contain sensitive screen data -> Enforce requester/admin ticket authorization for attachment access and avoid public, guessable URLs.
- File upload may succeed while message creation fails -> Treat unsent files as pending and either clean them up through storage lifecycle rules or avoid finalizing attachment records until message persistence succeeds.
- Large images can slow the widget and admin UI -> Restrict accepted MIME types and size, render thumbnails/previews, and show clear upload errors.
- Existing tests and fixtures assume only `screenshot` metadata -> Update API schemas, serializers, MSW fixtures, and component tests together so the contract stays coherent.
- Realtime events could duplicate optimistic messages -> Continue deduping by persisted message id and use attachment ids/storage keys from the canonical API response.

## Migration Plan

1. Add database migration fields for real image attachments while preserving existing screenshot rows.
2. Update API schemas and support services to accept image attachments on ticket creation and message creation.
3. Regenerate the API client after schema changes.
4. Update the widget and admin UI to render both legacy screenshot metadata and real image attachments.
5. Add upload controls and pending preview behavior in intake and active chat.
6. Validate with focused API/web tests and the existing help widget support flow.

Rollback is low risk if migrations are additive: the UI can hide upload controls while existing text messages and legacy screenshot metadata continue to render.

## Open Questions

- Which storage provider/path should be used for production image files in this repo: existing storage abstraction, API-managed uploads, or a new object storage adapter?
- What exact maximum file size should be accepted for support images?
- Should the requester be allowed to attach multiple images per message immediately, or should v1 limit each send action to one image while allowing repeated sends?

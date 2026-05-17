## ADDED Requirements

### Requirement: Support intake accepts image uploads
The system SHALL allow an authenticated user to select image attachments from the support intake state before starting a support chat.

#### Scenario: User attaches a screenshot before starting support
- **WHEN** an authenticated user opens "Falar com suporte" and activates the "Anexar captura de tela" control
- **THEN** the widget opens an image upload picker for supported image files
- **AND** the selected image is shown as a pending attachment preview in the intake state
- **AND** the user can remove the pending image before submitting the support request

#### Scenario: User selects an unsupported attachment
- **WHEN** the user selects a file that is not an accepted image type or exceeds the configured size limit
- **THEN** the widget does not attach the file to the pending support request
- **AND** the widget displays a Portuguese validation message without leaving the support intake state

### Requirement: Ticket creation persists intake image attachments
The system SHALL persist image attachments submitted with a support intake request and associate them with the first user message of the created support ticket.

#### Scenario: User starts support with text and an image
- **WHEN** an authenticated user submits a non-empty support issue with one or more pending image attachments
- **THEN** the API creates the support ticket using the authenticated user as requester
- **AND** the API creates the first user message in the same operation
- **AND** the API persists attachment metadata linked to that first message
- **AND** the support ticket response includes the created attachment metadata

#### Scenario: Intake attachment persistence fails
- **WHEN** the support ticket cannot persist the selected image attachment metadata
- **THEN** the API does not report the support request as successfully created with that attachment
- **AND** the widget shows a Portuguese error state that lets the user retry or remove the pending image

### Requirement: Active support chat accepts additional image messages
The system SHALL allow an authenticated requester to send image attachments from an already open support ticket conversation.

#### Scenario: User sends another image in an open chat
- **WHEN** an authenticated requester opens a support ticket conversation and activates the composer image attachment control
- **THEN** the widget opens an image upload picker for supported image files
- **AND** the selected image is shown as a pending composer preview
- **AND** submitting the composer creates a persisted user message with the image attachment linked to that message
- **AND** the conversation displays the sent image after the API confirms persistence

#### Scenario: User sends an attachment-only image message
- **WHEN** the requester has a pending image attachment in the composer and the text field is empty
- **THEN** the widget allows the send action
- **AND** the API persists a support ticket message representing the image attachment
- **AND** the rendered conversation identifies the message as an attached image in Portuguese

#### Scenario: User cancels a pending chat image
- **WHEN** the requester selects an image in the composer and removes it before sending
- **THEN** the widget clears the pending attachment preview
- **AND** no support ticket message is created for the removed image

### Requirement: Support conversations render image attachments inline
The system SHALL render persisted image attachments inline in support conversations for both the requester widget and the admin support ticket view.

#### Scenario: Requester views an image attachment
- **WHEN** the widget loads a support ticket that has a message-linked image attachment
- **THEN** the conversation renders an inline image preview within the corresponding message
- **AND** the preview includes accessible text derived from the attachment name or description

#### Scenario: Admin views an image attachment
- **WHEN** an authorized support/admin actor opens a support ticket that has message-linked image attachments
- **THEN** the admin support conversation renders each image inline with the corresponding message
- **AND** the attachment display preserves the existing support ticket layout without horizontal overflow

### Requirement: Image attachment access is authorized
The system SHALL restrict image attachment metadata and file access to actors who are authorized to access the associated support ticket.

#### Scenario: Unauthorized actor requests an attachment
- **WHEN** an actor who cannot access a support ticket attempts to read an image attachment or file reference for that ticket
- **THEN** the system denies access to the attachment data
- **AND** the actor does not receive a storage key, signed URL, or image preview payload

#### Scenario: Authorized actor receives attachment data
- **WHEN** an authorized requester or support/admin actor loads a support ticket with image attachments
- **THEN** the response includes only the attachment metadata and access information required to render the image
- **AND** the raw image bytes are not embedded in the support ticket realtime event payload

### Requirement: Realtime delivery includes image attachment metadata
The system SHALL deliver newly persisted image attachment messages through the existing support ticket realtime flow using lightweight metadata.

#### Scenario: Image message is published to an open conversation
- **WHEN** a support ticket message with an image attachment is persisted
- **THEN** the API publishes the existing support message-created realtime event after the database write succeeds
- **AND** subscribed authorized clients update the conversation with the message and attachment metadata without a manual refresh
- **AND** clients avoid duplicating the message when the canonical API response and realtime event contain the same message id

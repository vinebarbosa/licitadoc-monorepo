## ADDED Requirements

### Requirement: Completed document previews MUST expose a selection-based adjustment prompt
The system MUST allow authorized users to select text inside a completed document preview and open a floating prompt for describing the desired textual change.

#### Scenario: Floating prompt appears for selected preview text
- **WHEN** an authorized user selects non-empty text inside a completed document preview that has persisted draft content
- **THEN** the preview shows a floating input near the selection where the user can type the desired adjustment

#### Scenario: Floating prompt is hidden outside eligible preview text
- **WHEN** the document is generating, failed, empty, or the current selection is outside the rendered document body
- **THEN** the preview does not show the text-adjustment input

### Requirement: Text adjustment suggestions MUST preserve document tone and context
The system MUST generate adjustment suggestions from the selected text, the user's instruction, the document type, and surrounding/current document context so the replacement keeps the formal procurement tone and factual boundaries of the original draft.

#### Scenario: Suggestion request uses selected text and document context
- **WHEN** an authorized user submits an adjustment instruction for selected document text
- **THEN** the backend invokes the configured text-generation provider with the selected text, user instruction, document type, surrounding document context, and guidance to preserve tone and facts

#### Scenario: Suggestion response targets only the selected excerpt
- **WHEN** the backend returns an adjustment suggestion
- **THEN** the response contains a replacement for the selected excerpt without rewriting unrelated document sections

### Requirement: Suggested adjustments MUST require user acceptance before persistence
The system MUST show the generated replacement for review and MUST NOT update the stored draft content until the user explicitly applies the suggestion.

#### Scenario: Suggestion can be reviewed without changing stored content
- **WHEN** a text-adjustment suggestion is generated
- **THEN** the preview shows the suggested replacement with actions to apply or discard it
- **AND** the stored document draft content remains unchanged

#### Scenario: Accepted suggestion updates the preview content
- **WHEN** the user applies a generated adjustment suggestion
- **THEN** the backend persists the updated draft content for the same document
- **AND** the preview refreshes to show the updated text

#### Scenario: Discarded suggestion leaves content unchanged
- **WHEN** the user discards a generated adjustment suggestion
- **THEN** the preview hides the suggestion and the stored draft content remains unchanged

### Requirement: Text adjustment persistence MUST be authorized and deterministic
The system MUST only persist text adjustments for documents the actor can manage, and it MUST update the draft only when the selected target can be resolved unambiguously in the current document content.

#### Scenario: Unauthorized actor cannot adjust document text
- **WHEN** an actor without document management access requests a suggestion or attempts to apply a suggestion
- **THEN** the system rejects the request and leaves the document content unchanged

#### Scenario: Ambiguous or stale selection cannot be applied
- **WHEN** the apply request references selected text that no longer matches the current draft content or matches multiple possible targets without a usable context guard
- **THEN** the system rejects the apply request and leaves the document content unchanged

#### Scenario: Empty adjustment request is rejected
- **WHEN** the selected text or user instruction is empty after trimming
- **THEN** the system rejects the request without invoking the text-generation provider
